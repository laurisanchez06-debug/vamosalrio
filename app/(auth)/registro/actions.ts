"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeRedirect(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s.startsWith("/") ? s : "";
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(formData.get("redirect"));
  const qs = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : "";

  if (!email || !password) {
    redirect(
      `/registro?error=${encodeURIComponent("Completá email y contraseña.")}${qs}`,
    );
  }
  if (password.length < 6) {
    redirect(
      `/registro?error=${encodeURIComponent("La contraseña tiene que tener al menos 6 caracteres.")}${qs}`,
    );
  }

  let errorMessage: string | null = null;
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/completar-perfil${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
      },
    });
    errorMessage = error?.message ?? null;
  } catch (err) {
    // No dejamos que una excepción (ej. URL/clave de Supabase mal cargada en
    // el deploy) se convierta en un 500 sin mensaje al crear cuenta.
    console.error("[signUpAction] excepción al crear cuenta:", err);
    errorMessage =
      err instanceof Error
        ? err.message
        : "No pudimos crear la cuenta. Intentá de nuevo en un momento.";
  }

  if (errorMessage) {
    redirect(`/registro?error=${encodeURIComponent(errorMessage)}${qs}`);
  }

  redirect(
    `/completar-perfil${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
  );
}
