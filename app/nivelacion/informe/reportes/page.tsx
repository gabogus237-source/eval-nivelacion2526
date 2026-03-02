import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function b64urlEncode(s: string) {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export default async function ReportesNivelacionPage() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "COORD_NIVELACION") redirect("/");

  const { data, error } = await supabase
    .from("v_reporte_persona_componentes_unificado")
    .select(
      "evaluated_email,evaluated_name,prom_hetero_1a4,prom_auto_1a4,prom_par_1a4,prom_directivo_1a4"
    )
    .order("evaluated_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <div style={{ padding: 20 }}>
      <p>
        <Link href="/nivelacion">← Volver</Link>
      </p>

      <h1>Reportes / Informes</h1>

      {(data || []).map((r: any) => {
        const emailB64 = b64urlEncode(r.evaluated_email);
        return (
          <div
            key={r.evaluated_email}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <b>{r.evaluated_name}</b> — {r.evaluated_email}
            </div>

            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              HETERO: {r.prom_hetero_1a4 ?? "—"} | AUTO: {r.prom_auto_1a4 ?? "—"} |
              PAR: {r.prom_par_1a4 ?? "—"} | DIRECTIVO: {r.prom_directivo_1a4 ?? "—"}
            </div>

            <div style={{ marginTop: 6 }}>
              <Link href={`/nivelacion/informe/${emailB64}`}>Ver informe (PDF)</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}