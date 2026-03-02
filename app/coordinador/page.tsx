import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoordinatorHome() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const okRoles = ["COORD_ASIGNATURA", "COORDINADOR"];
  if (!okRoles.includes(profile.role)) redirect("/");

  const myEmail = (auth.user.email || profile.email || "").trim().toLowerCase();
  if (!myEmail) throw new Error("No se pudo leer tu correo.");

  // Mis asignaturas como coordinador
  const { data: mySubjects, error: sErr } = await supabase
    .from("coordinator_subjects")
    .select("asignatura")
    .eq("coordinator_email", myEmail);

  if (sErr) throw new Error(sErr.message);

  const subjectList = (mySubjects || []).map((x: any) => x.asignatura);

  // Docentes que dictan mis asignaturas (en todos los cursos)
  const { data: assignments, error: aErr } = subjectList.length
    ? await supabase
        .from("assignments")
        .select("id, course_code, asignatura, docente_name, docente_email")
        .in("asignatura", subjectList)
        .order("asignatura")
        .order("course_code")
    : { data: [], error: null };

  if (aErr) throw new Error(aErr.message);

  // ✅ 1) filtrar: sin docente_email y evitar auto-evaluación
  const filtered = (assignments || []).filter((a: any) => {
    const d = (a.docente_email || "").trim().toLowerCase();
    return d && d !== myEmail;
  });

  // ✅ 2) deduplicar por docente_email conservando 1 solo assignment.id (el primero)
  // y agregando info resumida de asignaturas/cursos para mostrar
  const map = new Map<string, any>();

  for (const a of filtered) {
    const key = (a.docente_email || "").trim().toLowerCase();
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, {
        id: a.id, // <- ESTE será el link /evaluate/:id
        docente_email: key,
        docente_name: a.docente_name || null,
        asignaturas: new Set<string>(),
        cursos: new Set<string>(),
      });
    }

    const row = map.get(key);
    if (!row.docente_name && a.docente_name) row.docente_name = a.docente_name;
    row.asignaturas.add(a.asignatura);
    row.cursos.add(a.course_code);
  }

  const uniqueDocentes = Array.from(map.values()).map((x) => ({
    ...x,
    asignaturas: Array.from(x.asignaturas).sort(),
    cursos: Array.from(x.cursos).sort(),
  }));

  return (
    <div>
      <h1>Panel Coordinador</h1>

      <p>
        <Link href="/coordinador/auto">Autoevaluación (AUTO)</Link>
      </p>

      <h2>PAR: Docentes de mis asignaturas</h2>

      {subjectList.length === 0 ? (
        <p style={{ color: "crimson" }}>
          No tienes asignaturas configuradas en coordinator_subjects para: <b>{myEmail}</b>
        </p>
      ) : uniqueDocentes.length === 0 ? (
        <p>No hay docentes para evaluar (o solo estás tú en esas asignaturas).</p>
      ) : (
        <ul>
          {uniqueDocentes.map((d: any) => (
            <li key={d.docente_email} style={{ marginBottom: 10 }}>
              <b>{d.docente_name || d.docente_email}</b>{" "}
              <span style={{ color: "#555" }}>
                · {d.asignaturas.join(", ")} · cursos: {d.cursos.join(", ")}
              </span>{" "}
              <Link href={`/coordinador/evaluate/${d.id}`}>Evaluar PAR</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}