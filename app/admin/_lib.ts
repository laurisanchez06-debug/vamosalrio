import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

// Devuelve { user, admin } si el usuario logueado es super admin, o null.
// `admin` es el cliente service_role (bypassa RLS) para leer/escribir todo.
export async function getAdminContext(): Promise<{
  userId: string;
  admin: SupabaseClient;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.is_admin) return null;
  return { userId: user.id, admin };
}

// Email por userId (auth.users no está expuesto vía PostgREST).
export async function emailDe(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}
