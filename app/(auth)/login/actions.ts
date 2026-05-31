"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/feed");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Completá email y contraseña.")}`);
  }

  const supabase = createClient();
  let errorMessage: string | null = null;
  let userId: string | null = null;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    errorMessage = error?.message ?? null;
    userId = data?.user?.id ?? null;
  } catch (err) {
    // Evita el 500 sin mensaje si Supabase no responde o las env vars del
    // deploy están mal cargadas. El detalle queda en los logs del servidor.
    console.error("[signInAction] excepción al iniciar sesión:", err);
    errorMessage =
      err instanceof Error
        ? err.message
        : "No pudimos iniciar sesión. Intentá de nuevo en un momento.";
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  // Si la cuenta está bloqueada, cerramos sesión y mostramos /suspendido.
  if (userId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("bloqueado")
      .eq("id", userId)
      .maybeSingle();
    if (prof?.bloqueado) {
      await supabase.auth.signOut();
      redirect("/suspendido");
    }
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/feed");
}
