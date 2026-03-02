import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OPTIONS = [
  { label: "S (Siempre)", value: 4 },
  { label: "CS (Casi siempre)", value: 3 },
  { label: "EAO (En algunas ocasiones)", value: 2 },
  { label: "N (Nunca)", value: 1 },
];

export default async function StudentEvaluatePage({
  params,
  searchParams,
}: {
  params: { assignmentId: string };
  searchParams?: { status?: string };
}) {
  const assignmentId = String(params.assignmentId);
  const status = searchParams?.status || "";

  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("role, selected_course_code, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (pErr) throw new Error(pErr.message);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "STUDENT") redirect("/");

  const { data: assignment, error: aErr } = await supabase
    .from("assignments")
    .select("id, course_code, asignatura, docente_email, docente_name")
    .eq("id", assignmentId)
    .maybeSingle();

  if (aErr) throw new Error(aErr.message);
  if (!assignment) redirect("/student");

  // Seguridad: solo evaluar si pertenece al curso seleccionado
  if (assignment.course_code !== profile.selected_course_code) redirect("/student");

  // Preguntas
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, item, dimension, question")
    .eq("instrument", "ESTUD")
    .order("item");

  if (qErr) throw new Error("Error cargando preguntas: " + qErr.message);

  // Emails para verificar "ya evaluó" antes de mostrar el formulario
  const evaluatorEmail = (auth.user.email || profile.email || "").trim().toLowerCase();
  const evaluatedEmail = (assignment.docente_email || "").trim().toLowerCase();

  if (!evaluatorEmail) redirect("/login");
  if (!evaluatedEmail) {
    // si falta docente_email, no tiene sentido mostrar el formulario
    return (
      <div>
        <p>
          <Link href="/student">← Volver</Link>
        </p>
        <p style={{ color: "red" }}>
          Este docente no tiene correo en assignments (docente_email). Corrige eso primero.
        </p>
      </div>
    );
  }

  // ✅ Si ya existe evaluación, bloquea el formulario y muestra mensaje
  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("component", "HETERO")
    .eq("target_role", "DOCENTE")
    .eq("evaluator_email", evaluatorEmail)
    .eq("evaluated_email", evaluatedEmail)
    .eq("course_code", assignment.course_code)
    .maybeSingle();

  async function submit(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();

    const { data: auth2 } = await supabase.auth.getUser();
    if (!auth2.user) redirect("/login");

    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("email, role, selected_course_code")
      .eq("id", auth2.user.id)
      .maybeSingle();

    if (meErr) throw new Error(meErr.message);
    if (!me || me.role !== "STUDENT") redirect("/");

    const { data: a2, error: a2Err } = await supabase
      .from("assignments")
      .select("id, course_code, docente_email, docente_name")
      .eq("id", assignmentId)
      .maybeSingle();

    if (a2Err) throw new Error(a2Err.message);
    if (!a2) redirect("/student");
    if (a2.course_code !== me.selected_course_code) redirect("/student");

    const evaluatorEmail2 = (auth2.user.email || me.email || "").trim().toLowerCase();
    if (!evaluatorEmail2) throw new Error("No se pudo leer tu correo. Cierra sesión y vuelve a ingresar.");

    const evaluatedEmail2 = (a2.docente_email || "").trim().toLowerCase();
    const evaluatedName2 = (a2.docente_name || "").trim();

    if (!evaluatedEmail2) {
      throw new Error("Este docente no tiene correo en assignments (docente_email).");
    }

    // Re-cargar preguntas (seguridad) y validar completitud
    const { data: qs2, error: qs2Err } = await supabase
      .from("questions")
      .select("id")
      .eq("instrument", "ESTUD")
      .order("item");

    if (qs2Err) throw new Error("Error cargando preguntas: " + qs2Err.message);
    if (!qs2 || qs2.length === 0) throw new Error("No hay preguntas (instrument=ESTUD).");

    for (const q of qs2) {
      const raw = formData.get("q_" + q.id);
      const v = Number(raw);
      if (![1, 2, 3, 4].includes(v)) {
        redirect(`/student/evaluate/${assignmentId}?status=incomplete`);
      }
    }

    // ✅ Pre-chequeo: si ya existe, no intentes insertar
    const { data: exists2, error: exErr } = await supabase
      .from("evaluations")
      .select("id")
      .eq("component", "HETERO")
      .eq("target_role", "DOCENTE")
      .eq("evaluator_email", evaluatorEmail2)
      .eq("evaluated_email", evaluatedEmail2)
      .eq("course_code", a2.course_code)
      .maybeSingle();

    if (exErr) throw new Error(exErr.message);
    if (exists2?.id) {
      redirect(`/student/evaluate/${assignmentId}?status=already`);
    }

    // Insert cabecera
    const { data: ev, error: evErr } = await supabase
      .from("evaluations")
      .insert({
        component: "HETERO",
        target_role: "DOCENTE",
        evaluator_id: auth2.user.id,
        evaluated_id: null, // docente NO necesita registrarse
        course_code: a2.course_code,
        evaluator_email: evaluatorEmail2,
        evaluated_email: evaluatedEmail2,
        evaluated_name: evaluatedName2 || null,
      })
      .select("id")
      .single();

    // Manejo de UNIQUE (si hubo doble click / carrera)
    if (evErr) {
      const code = (evErr as any)?.code; // 23505 = unique_violation
      if (code === "23505" || evErr.message.includes("evaluations_unique_email")) {
        redirect(`/student/evaluate/${assignmentId}?status=already`);
      }
      throw new Error(evErr.message);
    }

    // Insert items
    const items: any[] = [];
    for (const q of qs2) {
      const v = Number(formData.get("q_" + q.id));
      items.push({ evaluation_id: ev.id, question_id: q.id, score: v });
    }

    const { error: itErr } = await supabase.from("evaluation_items").insert(items);
    if (itErr) throw new Error(itErr.message);

    redirect("/student");
  }

  return (
    <div>
      <p>
        <Link href="/student">← Volver</Link>
      </p>

      <h1>Evaluación del Docente</h1>
      <p>
        Materia: <b>{assignment.asignatura}</b>
        <br />
        Docente: <b>{assignment.docente_name || assignment.docente_email || "Docente"}</b>
        <br />
        Curso: <b>{assignment.course_code}</b>
      </p>

      {status === "incomplete" && (
        <p style={{ background: "#f8d7da", padding: 10, borderRadius: 8 }}>
          ❌ Debes responder TODAS las preguntas antes de enviar.
        </p>
      )}

      {(status === "already" || existing?.id) && (
        <p style={{ background: "#fff3cd", padding: 10, borderRadius: 8 }}>
          ⚠️ Ya evaluaste a este docente para este curso. No puedes enviar otra vez.
        </p>
      )}

      {/* Si ya evaluó, no muestres el formulario */}
      {existing?.id ? (
        <p style={{ marginTop: 12 }}>
          <Link href="/student">Volver al panel</Link>
        </p>
      ) : (
        <form action={submit}>
          {(questions || []).map((q: any) => (
            <div
              key={q.id}
              style={{
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>
                Ítem {q.item} · {q.dimension}
              </div>
              <div style={{ margin: "6px 0 10px 0" }}>{q.question}</div>

              {/* ✅ required evita enviar incompleto desde el navegador */}
              <select
                name={"q_" + q.id}
                defaultValue=""
                required
                style={{ padding: 8, width: "100%", maxWidth: 420 }}
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button style={{ padding: 10 }} type="submit">
            Enviar evaluación
          </button>
        </form>
      )}
    </div>
  );
}