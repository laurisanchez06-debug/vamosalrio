"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Cierre efectivo (ISO): cierre_inscripcion ?? fecha_hora. */
  cierre: string;
  /** Si true, no renderiza nada mientras esté abierta (solo muestra el cierre). */
  soloCerrada?: boolean;
  className?: string;
};

type Estado = {
  cerrada: boolean;
  urgente: boolean; // falta menos de 24hs
  texto: string;
};

function calcular(cierreMs: number, ahoraMs: number): Estado {
  const diff = cierreMs - ahoraMs;
  if (diff <= 0) {
    return { cerrada: true, urgente: false, texto: "Inscripción cerrada" };
  }
  const horasTotal = diff / 3_600_000;
  if (horasTotal >= 24) {
    const dias = Math.floor(horasTotal / 24);
    const horas = Math.floor(horasTotal % 24);
    return { cerrada: false, urgente: false, texto: `Cierra en ${dias}d ${horas}h` };
  }
  if (horasTotal >= 1) {
    const horas = Math.floor(horasTotal);
    return {
      cerrada: false,
      urgente: true,
      texto: `Cierra en ${horas} ${horas === 1 ? "hora" : "horas"}`,
    };
  }
  const mins = Math.max(1, Math.ceil(diff / 60_000));
  return {
    cerrada: false,
    urgente: true,
    texto: `Cierra en ${mins} min`,
  };
}

export default function CierreCountdown({
  cierre,
  soloCerrada = false,
  className = "",
}: Props) {
  const cierreMs = new Date(cierre).getTime();
  // Estado inicial: se recalcula en el cliente al montar y cada 60s.
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    if (Number.isNaN(cierreMs)) return;
    const tick = () => setEstado(calcular(cierreMs, Date.now()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [cierreMs]);

  if (!estado || Number.isNaN(cierreMs)) return null;
  if (soloCerrada && !estado.cerrada) return null;

  const color = estado.cerrada
    ? "text-tinta/50"
    : estado.urgente
      ? "text-arena"
      : "text-tinta/60";

  return (
    <span
      className={`inline-flex items-center gap-1 ${color} ${className}`}
      suppressHydrationWarning
    >
      <span aria-hidden>{estado.cerrada ? "🔒" : "⏳"}</span>
      {estado.texto}
    </span>
  );
}
