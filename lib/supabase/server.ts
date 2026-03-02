import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // En Server Components, cookies().set puede lanzar error.
          // Con middleware refrescando sesión, esto normalmente no se necesita,
          // pero dejamos try/catch para evitar fallos en runtime.
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // noop
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // noop
          }
        },
      },
    }
  );
}
