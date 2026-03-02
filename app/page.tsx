import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.role) redirect("/onboarding");

  // Normaliza roles soportados
  const role = String(profile.role || "").toUpperCase();

  if (role === "STUDENT") redirect("/student");
  if (role === "DOCENTE") redirect("/docente");

  // Coordinadores
  if (role === "COORDINADOR" || role === "COORD_ASIGNATURA") redirect("/coordinador");

  // Coordinación de nivelación
  if (role === "COORD_NIVELACION") redirect("/nivelacion");

  redirect("/onboarding");
}
