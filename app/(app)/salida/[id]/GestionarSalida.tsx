"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import Toast from "@/components/Toast";
import { cancelarSalidaAction, finalizarSalidaAction } from "./actions";

const MOTIVOS = [
  { value: "fuerza_mayor", label: "Clima / emergencia / fuerza mayor" },
  { value: "cuorum_no_alcanzado", label: "No llegamos al mínimo de participantes" },
  { value: "personal", label: "Motivo personal" },
];

export default function GestionarSalida({
  salidaId,
  puedeEditar,
  puedeFinalizar,
  puedeCancelar,
}: {
  salidaId: string;
  puedeEditar: boolean;
  puedeFinalizar: boolean;
  puedeCancelar: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [cancelAbierto, setCancelAbierto] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "error" } | null>(
    null,
  );
  const [, startTransition] = useTransition();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  function showToast(msg: string, tipo: "info" | "error" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  function finalizarSalida() {
    if (typeof window === "undefined") return;
    if (
      !window.confirm(
        "¿Marcar la salida como finalizada? Vas a poder calificar a la tripulación.",
      )
    ) {
      return;
    }
    setAbierto(false);
    setFinalizando(true);
    startTransition(async () => {
      const r = await finalizarSalidaAction(salidaId);
      setFinalizando(false);
      if ("error" in r) showToast(r.error, "error");
      else {
        showToast("Salida finalizada ✓");
        router.refresh();
      }
    });
  }

  function confirmarCancelacion() {
    if (!cancelMotivo) {
      showToast("Elegí un motivo.", "error");
      return;
    }
    setCancelando(true);
    startTransition(async () => {
      try {
        await cancelarSalidaAction(salidaId, cancelMotivo);
      } catch {
        // NEXT_REDIRECT relanza; cualquier otro error no debería ocurrir.
        setCancelando(false);
        showToast("No pudimos cancelar la salida.", "error");
      }
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="inline-flex items-center gap-1.5 rounded-full bg-noche px-3.5 py-2 text-sm font-semibold text-crema active:scale-[0.98]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Gestionar
      </button>

      {abierto ? (
        <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-tinta/10 bg-white shadow-xl">
          {puedeEditar ? (
            <Link
              href={`/salida/${salidaId}/editar`}
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-noche transition hover:bg-crema"
            >
              <span aria-hidden>✏️</span> Editar salida
            </Link>
          ) : null}
          {puedeFinalizar ? (
            <button
              type="button"
              onClick={finalizarSalida}
              disabled={finalizando}
              className="flex w-full items-center gap-2 border-t border-tinta/5 px-4 py-3 text-left text-sm font-medium text-rio transition hover:bg-crema disabled:opacity-60"
            >
              <span aria-hidden>🏁</span>{" "}
              {finalizando ? "Finalizando…" : "Finalizar salida"}
            </button>
          ) : null}
          {puedeCancelar ? (
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setCancelAbierto(true);
              }}
              className="flex w-full items-center gap-2 border-t border-tinta/5 px-4 py-3 text-left text-sm font-medium text-arena transition hover:bg-crema"
            >
              <span aria-hidden>🚫</span> Cancelar salida
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Modal: cancelar salida con motivo */}
      {cancelAbierto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-noche/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-noche">¿Cancelar la salida?</h3>
            <p className="mt-1 text-sm text-tinta/60">
              Contanos el motivo. La tripulación queda avisada.
            </p>

            <div className="mt-4 space-y-2">
              {MOTIVOS.map((m) => {
                const active = cancelMotivo === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setCancelMotivo(m.value)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "border-rio bg-rio/10 text-noche"
                        : "border-tinta/15 bg-white text-tinta/80"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        active ? "border-rio bg-rio text-crema" : "border-tinta/25"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {cancelMotivo === "personal" ? (
              <p className="mt-3 text-xs text-arena">
                Si faltan 48hs o menos, se registra una cancelación de último
                momento en tu perfil.
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelAbierto(false)}
                disabled={cancelando}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={cancelando || !cancelMotivo}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-arena px-4 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-50"
              >
                {cancelando ? "Cancelando…" : "Cancelar salida"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </div>
  );
}
