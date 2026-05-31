"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !email.trim()) return;
    setPending(true);

    const supabase = createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== "undefined" ? window.location.origin : "");
    // No miramos el resultado a propósito: el mensaje es el mismo exista o no
    // el mail (no filtramos qué direcciones están registradas).
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${appUrl}/reset-password`,
    });

    setPending(false);
    setEnviado(true);
  }

  return (
    <AuthCard
      titulo="Recuperar contraseña"
      subtitulo="Te mandamos un link para que elijas una nueva."
      footer={
        <>
          ¿Te acordaste?{" "}
          <Link href="/login" className="font-semibold text-rio">
            Volver a entrar
          </Link>
        </>
      }
    >
      {enviado ? (
        <p className="rounded-2xl bg-rio/10 px-4 py-4 text-sm leading-relaxed text-rio">
          Si el mail existe, te llegó un link para resetear. Revisá tu casilla
          (y el spam, por las dudas).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-noche"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@ejemplo.com"
              className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Enviarme el link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
