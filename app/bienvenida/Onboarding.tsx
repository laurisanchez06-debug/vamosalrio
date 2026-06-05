"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { completarOnboardingAction } from "./actions";

const SLIDES = [
  {
    icon: "🌊",
    titulo: "Bienvenido a vamosalrio 🌊",
    cuerpo:
      "Encontrá tu próxima tripulación. Sumate a salidas al río en Rosario o creá la tuya.",
  },
  {
    icon: "🧭",
    titulo: "¿Cómo funciona?",
    cuerpo:
      "Explorá las salidas, pedí sumarte a la que te guste, y cuando el anfitrión te acepta, ¡ya sos parte de la tripulación!",
  },
  {
    icon: "⛵",
    titulo: "Organizá tu propia salida",
    cuerpo:
      "¿Tenés lancha o ganas de armar un plan? Creá una salida, elegí el punto de encuentro y sumá tripulación. Calificaciones de ida y vuelta para que todos naveguen tranquilos.",
  },
];

const TOTAL = SLIDES.length;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  // Tanto "Saltar" como "Empezar" cierran el onboarding y van al feed.
  function finalizar() {
    startTransition(async () => {
      await completarOnboardingAction("feed");
    });
  }

  const slide = SLIDES[step - 1];
  const esUltimo = step === TOTAL;

  return (
    <div className="relative flex min-h-screen flex-col bg-crema px-6 pb-10 pt-6">
      {/* Header: isotipo de marca + Saltar (siempre visible) */}
      <div className="flex items-center justify-between">
        <Image
          src="/vamosalrio_isotipo.png"
          alt="vamosalrio"
          width={36}
          height={36}
          priority
          className="h-9 w-9"
        />
        <button
          type="button"
          onClick={finalizar}
          disabled={pending}
          className="text-sm font-semibold text-tinta/50 transition hover:text-tinta/70 disabled:opacity-50"
        >
          Saltar
        </button>
      </div>

      {/* Slide actual */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-rio/10 text-5xl">
            {slide.icon}
          </div>
          <h1 className="mt-8 text-balance text-3xl font-bold tracking-tight text-noche">
            {slide.titulo}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-pretty text-lg leading-relaxed text-tinta/70">
            {slide.cuerpo}
          </p>
        </div>
      </div>

      {/* Indicador de pasos (dots) */}
      <div className="flex items-center justify-center gap-2 py-6">
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-1.5 rounded-full transition-all ${
              i + 1 === step ? "w-6 bg-rio" : "w-1.5 bg-tinta/20"
            }`}
          />
        ))}
      </div>

      {/* Navegación */}
      <button
        type="button"
        onClick={esUltimo ? finalizar : () => setStep((s) => Math.min(TOTAL, s + 1))}
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {esUltimo ? (pending ? "Un momento…" : "Empezar") : "Siguiente"}
      </button>
    </div>
  );
}
