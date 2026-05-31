"use client";

import { useState, useTransition } from "react";
import Toast from "@/components/Toast";
import { solicitarParticipacionAction } from "./actions";

type EstadoParticipacion = "pendiente" | "aceptado" | "rechazado" | null;

type Props = {
  salidaId: string;
  estadoInicial: EstadoParticipacion;
};

const MAX_MENSAJE = 300;

export default function BotonParticipar({ salidaId, estadoInicial }: Props) {
  const [estado, setEstado] = useState<EstadoParticipacion>(estadoInicial);
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "error" } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function showToast(msg: string, tipo: "info" | "error" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  function enviar() {
    if (pending) return;
    startTransition(async () => {
      const result = await solicitarParticipacionAction(salidaId, mensaje);
      if ("error" in result) {
        showToast(result.error, "error");
      } else {
        setEstado("pendiente");
        setAbierto(false);
        showToast("Solicitud enviada. El organizador te confirma pronto.");
      }
    });
  }

  // Ya hay una participación resuelta: botón informativo.
  if (estado !== null) {
    let label = "Solicitud enviada";
    let className =
      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50";
    if (estado === "aceptado") {
      label = "¡Estás adentro!";
      className =
        "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 text-base font-semibold text-crema";
    } else if (estado === "rechazado") {
      label = "No fue esta vez";
    }
    return (
      <>
        <button type="button" disabled className={`${className} cursor-default`}>
          {label}
        </button>
        {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
      </>
    );
  }

  // Paso de presentación.
  if (abierto) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label
          htmlFor="presentacion"
          className="mb-1 block text-sm font-medium text-noche"
        >
          Presentate al organizador (¿por qué querés sumarte?)
        </label>
        <textarea
          id="presentacion"
          rows={4}
          maxLength={MAX_MENSAJE}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Ej: ¡Hola! Me copa el río, soy buena onda y llevo el mate. ¿Hay lugar?"
          className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-tinta/50">
          <span>Opcional, pero recomendado.</span>
          <span>
            {mensaje.length}/{MAX_MENSAJE}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAbierto(false)}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-rio px-4 text-sm font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
        {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
      </div>
    );
  }

  // Botón inicial.
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
      >
        ¡Me sumo!
      </button>
      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </>
  );
}
