import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeCedula(raw: any): string {
  const s = String(raw ?? "").trim().replace(/\.0$/, "");
  if (/^\d+$/.test(s) && s.length < 10) return s.padStart(10, "0");
  return s;
}

async function findAuthUserIdByEmailFallback(admin: any, email: string) {
  // Fallback raro: usuario existe en Auth pero no hay profile.
  // Recorre pocas páginas para no bloquear el endpoint.
  for (let page = 1; page <= 5; page++) {
    const { data: lu, error: luErr } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    } as any);
    if (luErr) throw new Error(luErr.message);

    const u = (lu?.users || []).find(
      (x: any) => String(x.email || "").trim().toLowerCase() === email
    );
    if (u?.id) return u.id as string;

    if (!lu?.users || lu.users.length < 1000) break;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const cedula = normalizeCedula(body?.cedula);

    if (!email || !email.includes("@")) {
      return new NextResponse("Correo inválido.", { status: 400 });
    }
    if (!cedula) {
      return new NextResponse("Cédula requerida.", { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return new NextResponse(
        "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Dominio o whitelist
    const domain = (process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN || "uce.edu.ec").toLowerCase();
    const isInstitutional = email.endsWith("@" + domain);

    if (!isInstitutional) {
      const { data: wl, error: wlErr } = await admin
        .from("email_whitelist")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (wlErr) return new NextResponse(wlErr.message, { status: 500 });
      if (!wl) {
        return new NextResponse(
          `Correo externo no autorizado. Pide que agreguen ${email} a email_whitelist.`,
          { status: 403 }
        );
      }
    }

    // 2) Validación contra directorios
    const { data: student, error: sErr } = await admin
      .from("student_directory")
      .select("email, cedula")
      .eq("email", email)
      .maybeSingle();

    if (sErr) return new NextResponse(sErr.message, { status: 500 });

    const { data: docente, error: dErr } = await admin
      .from("docente_directory")
      .select("email, cedula, full_name")
      .eq("email", email)
      .maybeSingle();

    if (dErr) return new NextResponse(dErr.message, { status: 500 });

    const sCed = student ? normalizeCedula(student.cedula) : null;
    const dCed = docente ? normalizeCedula(docente.cedula) : null;

    const isStudent = !!student;
    const isDocente = !!docente;

    // Seguridad de datos: un correo no debe existir en ambos directorios.
    // Si ocurre, pide corregir el registro (evita ambigüedad en el login).
    if (isStudent && isDocente) {
      return new NextResponse(
        "Tu correo aparece en student_directory y docente_directory. Pide a administración que lo deje solo en uno.",
        { status: 409 }
      );
    }

    if (!isStudent && !isDocente) {
      return new NextResponse(
        "Tu correo no está en student_directory ni en docente_directory.",
        { status: 401 }
      );
    }

    if (isStudent && sCed !== cedula) {
      return new NextResponse("Cédula incorrecta para estudiante.", { status: 401 });
    }

    if (isDocente && dCed !== cedula) {
      return new NextResponse("Cédula incorrecta para docente.", { status: 401 });
    }

    // 3) Resolver rol: role_registry > coordinator_subjects > docente_directory > student_directory
    let role: string | null = null;

    // role_registry es opcional (si no existe la tabla, no debe romper el login)
    {
      const { data: rr, error: rrErr } = await admin
        .from("role_registry")
        .select("role")
        .eq("email", email)
        .maybeSingle();

      if (rrErr) {
        const msg = String((rrErr as any).message || "");
        const code = String((rrErr as any).code || "");
        const missingTable =
          code === "PGRST205" ||
          msg.toLowerCase().includes("could not find the table") ||
          msg.toLowerCase().includes("schema cache");

        if (!missingTable)
          return new NextResponse(msg || "Error consultando role_registry.", { status: 500 });
      } else {
        if (rr?.role) role = rr.role;
      }
    }

    if (!role) {
      const { data: cs, error: csErr } = await admin
        .from("coordinator_subjects")
        .select("coordinator_email")
        .eq("coordinator_email", email)
        .limit(1);

      if (csErr) return new NextResponse(csErr.message, { status: 500 });
      // La base usa enum user_role con valores: STUDENT, DOCENTE, COORD_ASIGNATURA, COORD_NIVELACION
      // Antes se usaba "COORDINADOR" (deprecado). Mantener compatibilidad asignando COORD_ASIGNATURA.
      if (cs && cs.length > 0) role = "COORD_ASIGNATURA";
    }

    if (!role) role = isDocente ? "DOCENTE" : "STUDENT";

    // 4) Resolver userId desde profiles, o crear usuario.
    let userId: string | null = null;

    const { data: profByEmail, error: pbeErr } = await admin
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (pbeErr) return new NextResponse(pbeErr.message, { status: 500 });
    if (profByEmail?.id) userId = profByEmail.id;

    // Si ya existe un perfil con rol COORD_NIVELACION, NO lo sobreescribas.
    // (Caso: la Coordinadora de Nivelación está en docente_directory, pero su rol se asigna manualmente.)
    if (String(profByEmail?.role || "").toUpperCase() === "COORD_NIVELACION") {
      role = "COORD_NIVELACION";
    }

    if (!userId) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password: cedula,
        email_confirm: true,
      });

      if (!cErr) {
        userId = created.user?.id || null;
      } else {
        // Si ya existe en Auth pero no hay profile
        const msg = String((cErr as any).message || "");
        const looksDup = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered");
        if (!looksDup) return new NextResponse(msg || "No se pudo crear usuario.", { status: 500 });

        try {
          userId = await findAuthUserIdByEmailFallback(admin as any, email);
        } catch (e: any) {
          return new NextResponse(e?.message || "Error listando usuarios.", { status: 500 });
        }
      }
    }

    if (!userId) return new NextResponse("No se pudo resolver el usuario en Auth.", { status: 500 });

    // 5) Asegura password=cedula
    const { error: uErr } = await admin.auth.admin.updateUserById(userId, {
      password: cedula,
      email_confirm: true,
    });
    if (uErr) return new NextResponse(uErr.message, { status: 500 });

    // 6) Upsert profile
    const { error: pErr } = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        role,
      },
      { onConflict: "id" }
    );

    if (pErr) return new NextResponse(pErr.message, { status: 500 });

    return NextResponse.json({ ok: true, role });
  } catch (e: any) {
    return new NextResponse(e?.message || "Error", { status: 500 });
  }
}
