import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Desactivar notificaciones desde el Perfil: borra la(s) sub(s) del usuario.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let endpoint: string | undefined;
  try {
    const body = (await req.json()) as { endpoint?: string };
    endpoint = body?.endpoint;
  } catch {
    // sin endpoint: borramos todas las del usuario
  }

  const admin = createAdminClient();
  let query = admin.from("push_subscriptions").delete().eq("user_id", user.id);
  if (endpoint) query = query.eq("endpoint", endpoint);
  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
