import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SelectCourse() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, selected_course_code").eq("id", data.user.id).maybeSingle();
  if (!profile) redirect("/onboarding");
  if (profile.role !== "STUDENT") redirect("/");

  if (profile.selected_course_code) redirect("/student");

  return (
    <div>
      <h1>Curso pendiente de asignación</h1>
      <p>
        Tu curso es asignado por la Coordinación conforme a la matrícula oficial.
        Si no aparece, comunícate con la Coordinación de Nivelación.
      </p>
    </div>
  );
}
