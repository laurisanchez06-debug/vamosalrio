"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GENEROS, calcularEdad } from "@/lib/format";
import { rateLimit } from "@/lib/rateLimit";

function safeRedirect(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s.startsWith("/") ? s : "";
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fechaNacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const genero = String(formData.get("genero") ?? "").trim();
  const aceptaTerminos = String(formData.get("acepta_terminos") ?? "") === "1";
  // Honeypot: campo oculto que los humanos no ven. Si viene lleno, es un bot.
  const honeypot = String(formData.get("website") ?? "").trim();
  const redirectTo = safeRedirect(formData.get("redirect"));
  const qs = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : "";

  // Bot detectado por honeypot: cortamos sin crear nada ni dar pistas.
  if (honeypot) {
    redirect("/");
  }

  // Rate limit por IP: máximo 5 registros por hora.
  const ip =
    (headers().get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "desconocida";
  if (!rateLimit(`registro:${ip}`, 5).ok) {
    redirect(
      `/registro?error=${encodeURIComponent("Demasiados intentos desde esta conexión. Probá de nuevo en un rato.")}${qs}`,
    );
  }

  if (!aceptaTerminos) {
    redirect(
      `/registro?error=${encodeURIComponent("Tenés que aceptar los Términos y la Política de Privacidad.")}${qs}`,
    );
  }

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

  // Edad y género obligatorios + barrera +18.
  const edad = calcularEdad(fechaNacimiento);
  if (!fechaNacimiento || edad == null) {
    redirect(
      `/registro?error=${encodeURIComponent("Completá tu fecha de nacimiento.")}${qs}`,
    );
  }
  if (edad! < 18) {
    redirect(
      `/registro?error=${encodeURIComponent("Tenés que ser mayor de 18 años para usar vamosalrio.")}${qs}`,
    );
  }
  if (!genero || !GENEROS.includes(genero as (typeof GENEROS)[number])) {
    redirect(
      `/registro?error=${encodeURIComponent("Elegí tu género.")}${qs}`,
    );
  }

  let errorMessage: string | null = null;
  let newUserId: string | null = null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/completar-perfil${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
      },
    });
    errorMessage = error?.message ?? null;
    newUserId = data?.user?.id ?? null;
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

  // Persistimos edad/género con service_role (la fila de profiles la crea el
  // trigger de signup; el update no depende de que ya haya sesión).
  if (newUserId) {
    try {
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({
          fecha_nacimiento: fechaNacimiento,
          genero,
          // Prueba del consentimiento (Términos + Privacidad).
          acepto_terminos_at: new Date().toISOString(),
        })
        .eq("id", newUserId);
    } catch (err) {
      console.error("[signUpAction] no se pudo guardar edad/género:", err);
    }
  }

  redirect(
    `/completar-perfil${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
  );
}
