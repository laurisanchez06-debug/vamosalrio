"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  bloquearDesdeReporteAction,
  desestimarReporteAction,
} from "../actions";

export default function ReporteAcciones({
  reporteId,
  reportadoId,
}: {
  reporteId: string;
  reportadoId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function correr(fn: () => Promise<{ ok: true } | { error: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if ("error" in r) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          correr(() => bloquearDesdeReporteAction(reporteId, reportadoId))
        }
        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-crema disabled:opacity-60"
      >
        Bloquear usuario
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => correr(() => desestimarReporteAction(reporteId))}
        className="rounded-full border border-tinta/15 bg-white px-3 py-1.5 text-xs font-semibold text-tinta/60 disabled:opacity-60"
      >
        Desestimar
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
