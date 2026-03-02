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

export default async function NivelacionEvaluarDocentesPage() {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const meEmail = String(auth.user.email || "").trim().toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "COORD_NIVELACION") redirect("/");

  // ✅ Excluir al usuario logueado de la lista de docentes
  const { data: docentes, error } = await supabase
    .from("docente_directory")
    .select("email, full_name")
    .neq("email", meEmail) // <- clave
    .order("full_name");

  if (error) throw new Error(error.message);

  return (
    <div>
      <p>
        <Link href="/nivelacion">← Volver</Link>
      </p>
      <h1>Directivo · Evaluar docentes</h1>

      <div style={{ marginTop: 12 }}>
        {(docentes || []).map((d: any) => {
          const email = String(d.email || "").trim().toLowerCase();
          const name = String(d.full_name || "").trim();
          const token = b64urlEncode(email);
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
              <div style={{ marginTop: 8 }}>
                <Link href={`/nivelacion/directivo/${token}`}>
                  Evaluar DIRECTIVO
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}