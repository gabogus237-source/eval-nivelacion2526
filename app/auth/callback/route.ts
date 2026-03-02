import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase manda aquí el "code" del Magic Link.
// 1) Intercambiamos el code por sesión (cookie)
// 2) Creamos/actualizamos el perfil del usuario (sin nombre; usando email)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // Crear/actualizar perfil
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (user?.id) {
    const email = (user.email || "").trim().toLowerCase();

    // Rol por defecto
    let role: "STUDENT" | "DOCENTE" | "COORD_ASIGNATURA" | "COORD_NIVELACION" = "STUDENT";

    // Si existe role_registry, prioriza ese rol (DOCENTE/COORD...). Si no existe, no rompe el login.
    try {
      if (email) {
        const { data: rr } = await supabase
          .from("role_registry")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (rr?.role) role = rr.role;
      }
    } catch {
      // ignore
    }

    // Upsert del perfil (sin full_name)
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: email || null,
          role,
        },
        { onConflict: "id" }
      );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
