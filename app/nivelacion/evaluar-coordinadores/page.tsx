import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function b64urlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export default async function NivelacionEvaluarCoordinadoresPage() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "COORD_NIVELACION") redirect("/");

  const { data: rows, error: cErr } = await supabase
    .from("coordinator_subjects")
    .select("coordinator_email, asignatura")
    .order("coordinator_email");

  if (cErr) throw new Error(cErr.message);

  const map = new Map<string, string[]>();
  for (const r of rows || []) {
    const e = String((r as any).coordinator_email || "").trim().toLowerCase();
    const a = String((r as any).asignatura || "").trim();
    if (!e) continue;
    if (!map.has(e)) map.set(e, []);
    if (a && !map.get(e)!.includes(a)) map.get(e)!.push(a);
  }

  const emails = Array.from(map.keys());

  // Traer nombres
  const { data: dd, error: dErr } = await supabase
    .from("docente_directory")
    .select("email, full_name")
    .in("email", emails);

  if (dErr) throw new Error(dErr.message);

  const nameMap = new Map<string, string>();
  for (const d of dd || []) {
    nameMap.set(String((d as any).email || "").trim().toLowerCase(), String((d as any).full_name || "").trim());
  }

  return (
    <div>
      <p>
        <Link href="/nivelacion">← Volver</Link>
      </p>
      <h1>PAR · Evaluar coordinadores</h1>

      <div style={{ marginTop: 12 }}>
        {emails.map((email) => {
          const name = nameMap.get(email) || "";
          const token = b64urlEncode(email);
          const asignaturas = (map.get(email) || []).join("; ");
          return (
            <div
              key={email}
              style={{
                padding: 10,
                border: "1px solid #eee",
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <div>
                <b>{name || email}</b>
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>{email}</div>
              {asignaturas ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                  Asignatura(s): {asignaturas}
                </div>
              ) : null}
              <div style={{ marginTop: 8 }}>
                <Link href={`/nivelacion/par-coordinador/${token}`}>Evaluar PAR</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
