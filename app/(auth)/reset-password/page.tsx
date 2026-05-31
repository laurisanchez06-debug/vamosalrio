"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    // El cliente del browser detecta el token de recuperación del link en la
    // URL al cargar (detectSessionInUrl), así que acá ya hay sesión temporal.
    const supabase = createClient();
    const { error: updErr } = await supabase.auth.updateUser({ password });
    if (updErr) {
      setPending(false);
      setError(
        /session|missing|expired/i.test(updErr.message)
          ? "El link venció o ya se usó. Pedí uno nuevo desde 'Olvidé mi contraseña'."
          : updErr.message,
      );
      return;
    }

    router.push("/feed?toast=password-actualizada");
  }

  return (
    <AuthCard
      titulo="Nueva contraseña"
      subtitulo="Elegí una contraseña nueva para tu cuenta."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="confirmar"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Repetir contraseña
          </label>
          <input
            id="confirmar"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Escribila de nuevo"
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-arena/15 px-4 py-3 text-sm text-arena">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </AuthCard>
  );
}
