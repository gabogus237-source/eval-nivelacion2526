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

function b64urlDecode(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(b64, "base64").toString("utf8");
}

export default async function NivelacionDirectivoEvaluatePage({
  params,
}: {
  params: { emailB64: string };
}) {
  const evaluatedEmail = b64urlDecode(String(params.emailB64 || "")).trim().toLowerCase();
  if (!evaluatedEmail.includes("@")) redirect("/nivelacion/evaluar-docentes");

  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "COORD_NIVELACION") redirect("/");

  const myEmail = (auth.user.email || profile.email || "").trim().toLowerCase();
  if (!myEmail) throw new Error("No se pudo leer tu correo.");

  const { data: docente, error: dErr } = await supabase
    .from("docente_directory")
    .select("email, full_name")
    .eq("email", evaluatedEmail)
    .maybeSingle();

  if (dErr) throw new Error(dErr.message);
  if (!docente) redirect("/nivelacion/evaluar-docentes");

  const evaluatedName = (docente.full_name || "").trim() || null;

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, item, dimension, question")
    .eq("instrument", "DIRECTIVO")
    .order("item");

  if (qErr) throw new Error("Error cargando preguntas DIRECTIVO: " + qErr.message);

  // ¿Ya evaluó?
  const { data: existing } = await supabase
    .from("evaluations")
    .select("id")
    .eq("component", "DIRECTIVO")
    .eq("target_role", "DOCENTE")
    .eq("evaluator_email", myEmail)
    .eq("evaluated_email", evaluatedEmail)
    .maybeSingle();

  async function submit(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();

    const { data: auth2 } = await supabase.auth.getUser();
    if (!auth2.user) redirect("/login");

    const { data: me } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", auth2.user.id)
      .maybeSingle();

    if (!me || me.role !== "COORD_NIVELACION") redirect("/");

    const email = (auth2.user.email || me.email || "").trim().toLowerCase();
    if (!email) throw new Error("No se pudo leer tu correo.");

    // Pre-check
    const { data: ex2 } = await supabase
      .from("evaluations")
      .select("id")
      .eq("component", "DIRECTIVO")
      .eq("target_role", "DOCENTE")
      .eq("evaluator_email", email)
      .eq("evaluated_email", evaluatedEmail)
      .maybeSingle();

    if (ex2?.id) redirect("/nivelacion/evaluar-docentes");

    const { data: ev, error: evErr } = await supabase
      .from("evaluations")
      .insert({
        component: "DIRECTIVO",
        target_role: "DOCENTE",
        evaluator_id: auth2.user.id,
        evaluated_id: null,
        course_code: null,
        evaluator_email: email,
        evaluated_email: evaluatedEmail,
        evaluated_name: evaluatedName,
      })
      .select("id")
      .single();

    if (evErr) {
      if (String(evErr.message).includes("evaluations_unique_email")) redirect("/nivelacion/evaluar-docentes");
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

    redirect("/nivelacion/evaluar-docentes");
  }

  return (
    <div>
      <p>
        <Link href="/nivelacion/evaluar-docentes">← Volver</Link>
      </p>

      <h1>Evaluación DIRECTIVO</h1>
      <p>
        Evaluado: <b>{evaluatedName || evaluatedEmail}</b>
        <br />
        Correo: <b>{evaluatedEmail}</b>
      </p>

      {existing?.id ? (
        <p style={{ color: "green" }}>✅ Ya registraste DIRECTIVO para este docente.</p>
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
            Enviar DIRECTIVO
          </button>
        </form>
      )}
    </div>
  );
}
