import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoordinatorHome() {
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

  return (
    <div>
      <h1>Panel Coordinador</h1>

      <p>
        <Link href="/coordinador/auto">Autoevaluación (AUTO)</Link>
      </p>

      <p>
        La coevaluación PAR Académico es realizada por la Coordinación de
        Nivelación.
      </p>
    </div>
  );
}
