"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCancelarSalidaAction } from "../actions";

export default function CancelarSalidaBtn({ salidaId }: { salidaId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function cancelar() {
    setError(null);
    startTransition(async () => {
      const r = await adminCancelarSalidaAction(salidaId);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setConfirmando(false);
      router.refresh();
    });
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
      >
        Cancelar
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={cancelar}
        disabled={pending}
        className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-crema disabled:opacity-60"
      >
        {pending ? "…" : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        disabled={pending}
        className="rounded-full border border-tinta/15 px-3 py-1 text-xs font-semibold text-tinta/60"
      >
        No
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
