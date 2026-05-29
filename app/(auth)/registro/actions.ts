"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/registro?error=${encodeURIComponent("Completá email y contraseña.")}`);
  }
  if (password.length < 6) {
    redirect(
      `/registro?error=${encodeURIComponent("La contraseña tiene que tener al menos 6 caracteres.")}`,
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/completar-perfil`,
    },
  });

  if (error) {
    redirect(`/registro?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/completar-perfil");
}
