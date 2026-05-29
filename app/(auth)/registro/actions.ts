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

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/completar-perfil${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
    },
  });

  if (error) {
    redirect(`/registro?error=${encodeURIComponent(error.message)}${qs}`);
  }

  redirect(
    `/completar-perfil${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
  );
}
