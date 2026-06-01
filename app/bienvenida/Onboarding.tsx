"use client";

import { useState, useTransition } from "react";
import { completarOnboardingAction } from "./actions";

const PASOS = [
  {
    n: "1",
    titulo: "Creá o sumate a una salida",
    icon: "➕",
  },
  {
    n: "2",
    titulo: "El host confirma la tripulación",
    icon: "✅",
  },
  {
    n: "3",
    titulo: "Al río, y después se califican",
    icon: "⭐",
  },
];

const TOTAL = 3;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  function finalizar(destino: "feed" | "perfil") {
    startTransition(async () => {
      await completarOnboardingAction(destino);
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-crema px-6 pb-10 pt-6">
      {/* Saltar — siempre visible */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => finalizar("feed")}
          disabled={pending}
          className="text-sm font-semibold text-tinta/50 transition hover:text-tinta/70 disabled:opacity-50"
        >
          Saltar
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {/* ── Pantalla 1 ── */}
        {step === 1 ? (
          <div className="text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-rio/10 text-5xl">
              🌊
            </div>
            <h1 className="mt-8 text-balance text-3xl font-bold tracking-tight text-noche">
              Bienvenido a vamosalrio 🌊
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-pretty text-lg leading-relaxed text-tinta/70">
              Encontrá salidas al río con gente que ya sabés quién es.
            </p>
          </div>
        ) : null}

        {/* ── Pantalla 2 ── */}
        {step === 2 ? (
          <div>
            <h1 className="text-center text-3xl font-bold tracking-tight text-noche">
              Cómo funciona
            </h1>
            <ol className="mt-8 space-y-4">
              {PASOS.map((p) => (
                <li
                  key={p.n}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rio/10 text-2xl">
                    {p.icon}
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-tinta/40">
                      Paso {p.n}
                    </div>
                    <div className="mt-0.5 text-base font-semibold text-noche">
                      {p.titulo}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {/* ── Pantalla 3 ── */}
        {step === 3 ? (
          <div className="text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-rio/10 text-5xl">
              👋
            </div>
            <h1 className="mt-8 text-balance text-3xl font-bold tracking-tight text-noche">
              Completá tu perfil
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-pretty text-lg leading-relaxed text-tinta/70">
              Subí una foto, contá quién sos y sumá tu Instagram. Así la gente
              te conoce antes de salir y entrás más fácil a las salidas.
            </p>
          </div>
        ) : null}
      </div>

      {/* Indicador de pasos */}
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
      {step < TOTAL ? (
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
        >
          Siguiente
        </button>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => finalizar("perfil")}
            disabled={pending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Un momento…" : "Completar ahora"}
          </button>
          <button
            type="button"
            onClick={() => finalizar("feed")}
            disabled={pending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-tinta/15 bg-white px-6 text-base font-semibold text-tinta/70 transition active:scale-[0.98] disabled:opacity-60"
          >
            Más tarde
          </button>
        </div>
      )}
    </div>
  );
}
