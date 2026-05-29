"use client";

import { useState, useTransition } from "react";
import Toast from "@/components/Toast";
import { solicitarParticipacionAction } from "./actions";

type EstadoParticipacion = "pendiente" | "aceptado" | "rechazado" | null;

type Props = {
  salidaId: string;
  estadoInicial: EstadoParticipacion;
};

export default function BotonParticipar({ salidaId, estadoInicial }: Props) {
  const [estado, setEstado] = useState<EstadoParticipacion>(estadoInicial);
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "error" } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function showToast(msg: string, tipo: "info" | "error" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  function onClick() {
    if (estado !== null || pending) return;
    startTransition(async () => {
      const result = await solicitarParticipacionAction(salidaId);
      if ("error" in result) {
        showToast(result.error, "error");
      } else {
        setEstado("pendiente");
        showToast("Solicitud enviada. El organizador te confirma pronto.");
      }
    });
  }

  let label = "Quiero ir";
  let disabled = false;
  let className =
    "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]";

  if (estado === "pendiente") {
    label = "Solicitud enviada";
    disabled = true;
    className =
      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50";
  } else if (estado === "aceptado") {
    label = "¡Estás adentro!";
    disabled = true;
    className =
      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 text-base font-semibold text-crema";
  } else if (estado === "rechazado") {
    label = "No fue esta vez";
    disabled = true;
    className =
      "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50";
  } else if (pending) {
    label = "Enviando…";
    disabled = true;
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className={`${className} disabled:cursor-default`}
      >
        {label}
      </button>
      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </>
  );
}
