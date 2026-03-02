import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NivelacionDashboard() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");
  if (profile.role !== "COORD_NIVELACION") redirect("/");

  return (
    <div>
      <h1>Coordinación de Nivelación</h1>
      <p>Usuario: <b>{profile.email || data.user.email}</b></p>

      <ul>
        <li><Link href="/nivelacion/evaluar-docentes">Evaluar docentes (Directivo 20%)</Link></li>
        <li><Link href="/nivelacion/evaluar-coordinadores">Evaluar coordinadores (Par Académico 30%)</Link></li>
      </ul>
    </div>
  );
}
