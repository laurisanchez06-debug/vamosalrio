"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBloqueoAction } from "../../actions";

export default function BloquearToggle({
  userId,
  bloqueado,
}: {
  userId: string;
  bloqueado: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const r = await toggleBloqueoAction(userId, !bloqueado);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`inline-flex h-11 items-center justify-center rounded-2xl px-6 text-sm font-semibold text-crema transition active:scale-[0.98] disabled:opacity-60 ${
          bloqueado ? "bg-emerald-600" : "bg-red-600"
        }`}
      >
        {pending
          ? "Guardando…"
          : bloqueado
            ? "Habilitar usuario"
            : "Bloquear usuario"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
