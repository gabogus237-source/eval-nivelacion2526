import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OPTIONS = [
  { label: "S (Siempre)", value: 4 },
  { label: "CS (Casi siempre)", value: 3 },
  { label: "EAO (En algunas ocasiones)", value: 2 },
  { label: "N (Nunca)", value: 1 },
];

export default async function CoordinatorParEvaluatePage({
  params,
}: {
  params: { assignmentId: string };
}) {
  const assignmentId = String(params.assignmentId);

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

  // Assignment a evaluar
  const { data: assignment, error: aErr } = await supabase
    .from("assignments")
    .select("id, course_code, asignatura, docente_email, docente_name")
    .eq("id", assignmentId)
    .maybeSingle();

  if (aErr) throw new Error(aErr.message);
  if (!assignment) redirect("/coordinador");

  // Seguridad: solo si esta asignatura es de este coordinador
  const { data: allowed } = await supabase
    .from("coordinator_subjects")
    .select("asignatura")
    .eq("coordinator_email", myEmail)
    .eq("asignatura", assignment.asignatura)
    .maybeSingle();

  if (!allowed) redirect("/coordinador");

  // Preguntas PAR
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, item, dimension, question")
    .eq("instrument", "PAR")
    .order("item");

  if (qErr) throw new Error("Error cargando preguntas PAR: " + qErr.message);

  const evaluatedEmail = (assignment.docente_email || "").trim().toLowerCase();

  // ¿Ya evaluó este docente en este curso?
  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("component", "PAR")
    .eq("target_role", "DOCENTE")
    .eq("evaluator_email", myEmail)
    .eq("evaluated_email", evaluatedEmail)
    .eq("course_code", assignment.course_code)
    .maybeSingle();

  async function submit(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();

    const { data: auth2 } = await supabase.auth.getUser();
    if (!auth2.user) redirect("/login");

    const { data: p2 } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", auth2.user.id)
      .maybeSingle();

    if (!p2) redirect("/onboarding");
    const okRoles2 = ["COORD_ASIGNATURA", "COORDINADOR"];
    if (!okRoles2.includes(p2.role)) redirect("/");

    const email = (auth2.user.email || p2.email || "").trim().toLowerCase();
    if (!email) throw new Error("No se pudo leer tu correo.");

    // Revalidar assignment
    const { data: a2 } = await supabase
      .from("assignments")
      .select("id, course_code, asignatura, docente_email, docente_name")
      .eq("id", assignmentId)
      .maybeSingle();

    if (!a2) redirect("/coordinador");

    // Revalidar permiso
    const { data: ok } = await supabase
      .from("coordinator_subjects")
      .select("asignatura")
      .eq("coordinator_email", email)
      .eq("asignatura", a2.asignatura)
      .maybeSingle();

    if (!ok) redirect("/coordinador");

    const docEmail = (a2.docente_email || "").trim().toLowerCase();
    const docName = (a2.docente_name || "").trim();
    if (!docEmail) throw new Error("Este docente no tiene docente_email en assignments.");

    // Pre-check para no chocar con unique
    const { data: ex2 } = await supabase
      .from("evaluations")
      .select("id")
      .eq("component", "PAR")
      .eq("target_role", "DOCENTE")
      .eq("evaluator_email", email)
      .eq("evaluated_email", docEmail)
      .eq("course_code", a2.course_code)
      .maybeSingle();

    if (ex2?.id) redirect("/coordinador");

    const { data: ev, error: evErr } = await supabase
      .from("evaluations")
      .insert({
        component: "PAR",
        target_role: "DOCENTE",
        evaluator_id: auth2.user.id,
        evaluated_id: null, // ✅ docente no necesita registrarse
        course_code: a2.course_code,
        evaluator_email: email,
        evaluated_email: docEmail,
        evaluated_name: docName || null,
      })
      .select("id")
      .single();

    if (evErr) {
      if (String(evErr.message).includes("evaluations_unique_email")) redirect("/coordinador");
      throw new Error(evErr.message);
    }

    const items: any[] = [];
    for (const q of questions || []) {
      const v = Number(formData.get("q_" + q.id));
      if (![1, 2, 3, 4].includes(v)) throw new Error("Faltan respuestas.");
      items.push({ evaluation_id: ev.id, question_id: q.id, score: v });
    }

    const { error: itErr } = await supabase.from("evaluation_items").insert(items);
    if (itErr) throw new Error(itErr.message);

    redirect("/coordinador");
  }

  return (
    <div>
      <p><Link href="/coordinador">← Volver</Link></p>

      <h1>Evaluación PAR</h1>
      <p>
        Asignatura: <b>{assignment.asignatura}</b><br />
        Curso: <b>{assignment.course_code}</b><br />
        Docente: <b>{assignment.docente_name || assignment.docente_email || "Docente"}</b>
      </p>

      {existing?.id ? (
        <p style={{ color: "green" }}>✅ Ya evaluaste a este docente en este curso.</p>
      ) : (
        <form action={submit}>
          {(questions || []).map((q: any) => (
            <div key={q.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#666" }}>
                Ítem {q.item} · {q.dimension}
              </div>
              <div style={{ margin: "6px 0 10px 0" }}>{q.question}</div>

              <select
                name={"q_" + q.id}
                defaultValue=""
                required
                style={{ padding: 8, width: "100%", maxWidth: 420 }}
              >
                <option value="" disabled>Selecciona…</option>
                {OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}

          <button style={{ padding: 10 }} type="submit">Enviar PAR</button>
        </form>
      )}
    </div>
  );
}