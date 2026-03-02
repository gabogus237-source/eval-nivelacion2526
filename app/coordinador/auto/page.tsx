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

// ✅ Macro-rol permitido por el CHECK constraint en public.evaluations.target_role
const TARGET_ROLE = "COORDINADOR";

export default async function CoordinatorAutoEvaluatePage() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  // ✅ Solo coordinadores de asignatura entran a esta pantalla
  const okRoles = ["COORD_ASIGNATURA"];
  if (!okRoles.includes(profile.role)) redirect("/");

  const myEmail = (auth.user.email || profile.email || "").trim().toLowerCase();
  if (!myEmail) throw new Error("No se pudo leer tu correo.");

  // Preguntas AUTO
  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, item, dimension, question")
    .eq("instrument", "AUTO")
    .order("item");

  if (qErr) throw new Error("Error cargando preguntas AUTO: " + qErr.message);

  // ✅ ¿Ya evaluó? (AUTO)
  // OJO: target_role debe ser 'COORDINADOR' para cumplir el CHECK
  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("component", "AUTO")
    .eq("target_role", TARGET_ROLE)
    .eq("evaluator_email", myEmail)
    .eq("evaluated_email", myEmail)
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

    const okRoles2 = ["COORD_ASIGNATURA"];
    if (!okRoles2.includes(p2.role)) redirect("/");

    const email = (auth2.user.email || p2.email || "").trim().toLowerCase();
    if (!email) throw new Error("No se pudo leer tu correo.");

    // ✅ Pre-check correcto
    const { data: ex2 } = await supabase
      .from("evaluations")
      .select("id")
      .eq("component", "AUTO")
      .eq("target_role", TARGET_ROLE)
      .eq("evaluator_email", email)
      .eq("evaluated_email", email)
      .maybeSingle();

    if (ex2?.id) redirect("/coordinador");

    // Nombre desde docente_directory (opcional)
    const { data: dd } = await supabase
      .from("docente_directory")
      .select("full_name")
      .eq("email", email)
      .maybeSingle();

    const evaluatedName = (dd?.full_name || "").trim() || null;

    // ✅ Insert en evaluations cumpliendo el CHECK target_role IN ('DOCENTE','COORDINADOR')
    const { data: ev, error: evErr } = await supabase
      .from("evaluations")
      .insert({
        component: "AUTO",
        target_role: TARGET_ROLE,
        evaluator_id: auth2.user.id,
        evaluated_id: null,
        course_code: null,
        evaluator_email: email,
        evaluated_email: email,
        evaluated_name: evaluatedName,
      })
      .select("id")
      .single();

    if (evErr) {
      // Si tienes índice único, aquí cae cuando ya existe.
      if (String(evErr.message).includes("evaluations_unique_email"))
        redirect("/coordinador");
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
      <p>
        <Link href="/coordinador">← Volver</Link>
      </p>

      <h1>Autoevaluación (Coordinador)</h1>
      <p>
        Coordinador: <b>{myEmail}</b>
      </p>

      {existing?.id ? (
        <p style={{ color: "green" }}>✅ Ya registraste tu autoevaluación.</p>
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
            Enviar AUTO
          </button>
        </form>
      )}
    </div>
  );
}