"use client";

import { useEffect, useState } from "react";

// Evento beforeinstallprompt (no está en los tipos estándar del DOM).
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_prompt_dismissed_until";
const DISMISS_DIAS = 7;

function estaInstalada() {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari expone navigator.standalone.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone;
  return Boolean(standalone || iosStandalone);
}

function fueDescartadaReciente() {
  try {
    const hasta = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() < hasta;
  } catch {
    return false;
  }
}

function esIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructivo, setShowInstructivo] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (estaInstalada() || fueDescartadaReciente()) return;

    // Android / Chrome: capturamos el evento nativo.
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    function onInstalled() {
      setVisible(false);
    }
    window.addEventListener("appinstalled", onInstalled);

    // iOS: no hay API de instalación → mostramos instrucciones.
    if (esIOS()) {
      setIsIos(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function descartar() {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DIAS * 24 * 60 * 60 * 1000),
      );
    } catch {
      // ignoramos si localStorage no está disponible
    }
    setVisible(false);
    setShowInstructivo(false);
  }

  async function instalar() {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // sin acción
    }
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Banner — por encima de la BottomNav */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+68px)] z-30 px-3">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-tinta/10 bg-white px-4 py-3 shadow-lg">
          <span className="text-xl" aria-hidden>
            📲
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-noche">
            Agregá vamosalrio a tu pantalla de inicio
          </p>
          {isIos ? (
            <button
              type="button"
              onClick={() => setShowInstructivo(true)}
              className="shrink-0 rounded-xl bg-rio px-3 py-2 text-sm font-semibold text-crema active:scale-[0.98]"
            >
              Cómo
            </button>
          ) : (
            <button
              type="button"
              onClick={instalar}
              className="shrink-0 rounded-xl bg-rio px-3 py-2 text-sm font-semibold text-crema active:scale-[0.98]"
            >
              Instalar app
            </button>
          )}
          <button
            type="button"
            onClick={descartar}
            aria-label="Cerrar"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-tinta/40 hover:bg-tinta/5"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Instructivo iOS */}
      {showInstructivo ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-noche/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-noche">
                Agregá vamosalrio a inicio
              </h3>
              <button
                type="button"
                onClick={() => setShowInstructivo(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-tinta/50 hover:bg-tinta/5"
              >
                ✕
              </button>
            </div>

            <ol className="mt-5 space-y-4">
              <PasoInstructivo numero={1} icono={<IconoCompartir />}>
                Tocá el botón <strong>Compartir</strong> (el cuadrado con la
                flecha hacia arriba ↑) abajo en Safari.
              </PasoInstructivo>
              <PasoInstructivo numero={2} icono={<IconoAgregar />}>
                Bajá y tocá <strong>“Agregar a inicio”</strong>.
              </PasoInstructivo>
              <PasoInstructivo numero={3} icono={<span className="text-xl">🌊</span>}>
                Listo, ya tenés <strong>vamosalrio</strong> como app en tu
                pantalla de inicio.
              </PasoInstructivo>
            </ol>

            <button
              type="button"
              onClick={() => setShowInstructivo(false)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PasoInstructivo({
  numero,
  icono,
  children,
}: {
  numero: number;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rio/10 text-rio">
        {icono}
      </span>
      <p className="text-sm leading-relaxed text-tinta/80">
        <span className="font-semibold text-noche">{numero}. </span>
        {children}
      </p>
    </li>
  );
}

function IconoCompartir() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function IconoAgregar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
