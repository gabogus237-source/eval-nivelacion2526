import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SelectCourse() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, selected_course_code").eq("id", data.user.id).maybeSingle();
  if (!profile) redirect("/onboarding");
  if (profile.role !== "STUDENT") redirect("/");

  const { data: courses } = await supabase.from("courses").select("code, modalidad").order("code");

  async function saveCourse(formData: FormData) {
    "use server";
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");

    const course = String(formData.get("course") || "").trim();
    if (!course) throw new Error("Selecciona un curso");
    await supabase.from("profiles").update({ selected_course_code: course }).eq("id", data.user.id);
    // opcional: guardar relación
    await supabase.from("student_courses").upsert({ student_id: data.user.id, course_code: course });
    redirect("/student");
  }

  return (
    <div>
      <h1>Selecciona tu curso</h1>
      <form action={saveCourse}>
        <select name="course" defaultValue={profile.selected_course_code || ""} style={{ padding: 10, width: 280 }}>
          <option value="" disabled>-- Selecciona --</option>
          {(courses || []).map((c: any) => (
            <option key={c.code} value={c.code}>{c.code} ({c.modalidad})</option>
          ))}
        </select>
        <div style={{ height: 12 }} />
        <button style={{ padding: 10 }} type="submit">Guardar</button>
      </form>
      <p style={{ marginTop: 12, color: "#666" }}>
        Importante: si seleccionas mal el curso, un administrador puede corregirlo editando tu perfil.
      </p>
    </div>
  );
}
