"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";

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
    // deploy están mal cargadas. (Diagnóstico temporal: muestra causa + host.)
    const base =
      err instanceof Error
        ? err.message
        : "No pudimos iniciar sesión. Intentá de nuevo en un momento.";
    const cause =
      err && typeof err === "object" && "cause" in err && (err as { cause?: unknown }).cause
        ? ` | cause: ${String((err as { cause?: { message?: string } }).cause?.message ?? (err as { cause?: unknown }).cause)}`
        : "";
    let host = "";
    try {
      host = ` | host: ${new URL(supabaseUrl()).host}`;
    } catch {
      host = ` | rawurl: ${JSON.stringify(supabaseUrl())}`;
    }
    errorMessage = `${base}${cause}${host}`;
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/feed");
}
