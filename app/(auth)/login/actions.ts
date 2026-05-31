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

  let errorMessage: string | null = null;
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    errorMessage = error?.message ?? null;
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

  redirect(redirectTo.startsWith("/") ? redirectTo : "/feed");
}
