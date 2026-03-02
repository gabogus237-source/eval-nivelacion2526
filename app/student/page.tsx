import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StudentDashboard() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, selected_course_code, email")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "STUDENT") redirect("/");
  const course = profile.selected_course_code;
  if (!course) redirect("/select-course");

  // 1) Trae las materias del curso con el email/nombre del docente desde assignments
  const { data: assignments, error: aErr } = await supabase
    .from("assignments")
    .select("id, asignatura, course_code, docente_email, docente_name")
    .eq("course_code", course)
    .order("asignatura");

  if (aErr) {
    return (
      <div>
        <h1>Error</h1>
        <pre>{aErr.message}</pre>
      </div>
    );
  }

  // 2) Arma lista única de correos de docentes para consultar el directorio
  const emails = Array.from(
    new Set(
      (assignments || [])
        .map((a: any) => (a.docente_email || "").toLowerCase().trim())
        .filter((e: string) => !!e)
    )
  );

  // 3) Consulta el directorio (email -> full_name)
  const directoryMap = new Map<string, string>();
  if (emails.length > 0) {
    const { data: dir, error: dErr } = await supabase
      .from("docente_directory")
      .select("email, full_name")
      .in("email", emails);

    if (!dErr) {
      (dir || []).forEach((d: any) => {
        const key = (d.email || "").toLowerCase().trim();
        if (key) directoryMap.set(key, d.full_name || "");
      });
    }
  }

  return (
    <div>
      <h1>Evaluación a Docentes (Heteroevaluación 40%)</h1>
      <p>
        Estudiante: <b>{profile.email || data.user.email}</b> | Curso: <b>{course}</b>
      </p>

      <h2 style={{ marginTop: 18 }}>Materias del curso</h2>
      <ul>
        {(assignments || []).map((a: any) => {
          const mail = (a.docente_email || "").toLowerCase().trim();
          const nombre =
            (a.docente_name || "").trim() ||
            (mail ? (directoryMap.get(mail) || "").trim() : "") ||
            a.docente_email ||
            "Docente";

          return (
            <li key={a.id} style={{ marginBottom: 8 }}>
              <b>{a.asignatura}</b> – {nombre}{" "}
              <Link href={`/student/evaluate/${a.id}`}>Evaluar</Link>
            </li>
          );
        })}
      </ul>

      <p style={{ marginTop: 18 }}>
        ¿Elegiste mal tu curso? <Link href="/select-course">Cambiar curso</Link>
      </p>
    </div>
  );
}