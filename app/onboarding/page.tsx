import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ya NO pedimos nombre.
 * Este page solo asegura que exista el perfil y manda a seleccionar curso.
 */
export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const email = (data.user.email || "").trim().toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, selected_course_code")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    // Si no existe, lo creamos como STUDENT (el rol puede ser actualizado por role_registry en el callback)
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: email || null,
      role: "STUDENT",
    });

    redirect("/select-course");
  }

  // Si es estudiante y no ha elegido curso todavía
  if (profile.role === "STUDENT" && !profile.selected_course_code) {
    redirect("/select-course");
  }

  redirect("/");
}
