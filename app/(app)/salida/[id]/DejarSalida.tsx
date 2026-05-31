"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { dejarSalidaAction } from "./actions";

const MS_48H = 48 * 60 * 60 * 1000;

export default function DejarSalida({
  salidaId,
  fechaHora,
}: {
  salidaId: string;
  fechaHora: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "error" } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Mismo umbral que valida el server; solo decide qué modal mostrar.
  const tarde = new Date(fechaHora).getTime() <= Date.now() + MS_48H;

  function confirmar() {
    startTransition(async () => {
      const r = await dejarSalidaAction(salidaId);
      if ("error" in r) {
        setToast({ msg: r.error, tipo: "error" });
        setAbierto(false);
        return;
      }
      setAbierto(false);
      setToast({
        msg: r.penalizado
          ? "Te bajaste. Se registró una cancelación de último momento."
          : "Te bajaste de la salida.",
        tipo: "info",
      });
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-tinta/15 bg-white px-6 text-sm font-semibold text-tinta/70 transition active:scale-[0.98]"
      >
        Dejar la salida
      </button>

      {abierto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-noche/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            {tarde ? (
              <>
                <h3 className="text-lg font-bold text-noche">
                  ⚠️ Cancelación de último momento
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-tinta/70">
                  Si te bajás ahora se registra una cancelación de último
                  momento en tu perfil. Los hosts lo van a ver.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-noche">
                  ¿Salís del plan?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-tinta/70">
                  Podés cancelar sin penalidad.
                </p>
              </>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={pending}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={pending}
                className={`inline-flex h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-60 ${
                  tarde ? "bg-arena" : "bg-rio"
                }`}
              >
                {pending ? "Saliendo…" : "Sí, me bajo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </>
  );
}
