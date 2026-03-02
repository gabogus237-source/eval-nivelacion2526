import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DocenteDashboard() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "DOCENTE") redirect("/");

  return (
    <div>
      <h1>Panel Docente</h1>
      <p>Docente: <b>{profile.email || data.user.email}</b></p>

      <ul>
        <li><Link href="/docente/autoevaluacion">Autoevaluación (10%)</Link></li>
      </ul>

      <p style={{ color: "#666" }}>
        (MVP) Aquí también se puede mostrar el resumen de resultados y link al PDF por docente.
      </p>
    </div>
  );
}
