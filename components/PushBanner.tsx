"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/lib/push/usePushNotifications";

const DISMISS_KEY = "push_banner_dismissed_until";
const DISMISS_DIAS = 7;

function fueDescartado() {
  try {
    return Date.now() < Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  } catch {
    return false;
  }
}

// Banner en el Feed para activar notificaciones. Aparece solo cuando el permiso
// está sin pedir (o en iOS sin la PWA instalada). Cerrable; no reaparece por 7
// días (localStorage).
export default function PushBanner() {
  const { estado, trabajando, activar } = usePushNotifications();
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    setOculto(fueDescartado());
  }, []);

  if (oculto) return null;
  if (estado !== "default" && estado !== "ios-instalar") return null;

  function descartar() {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DIAS * 24 * 60 * 60 * 1000),
      );
    } catch {
      // ignoramos si localStorage no está disponible
    }
    setOculto(true);
  }

  // iOS sin la PWA instalada: no se puede suscribir, guiamos a agregar a inicio.
  if (estado === "ios-instalar") {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rio/20 bg-rio/5 px-4 py-3">
        <span className="text-xl" aria-hidden>
          📲
        </span>
        <p className="min-w-0 flex-1 text-sm leading-snug text-tinta/80">
          Agregá la app a tu inicio y abrila desde el ícono para recibir avisos
          de tus salidas.
        </p>
        <button
          type="button"
          onClick={descartar}
          aria-label="Cerrar"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-tinta/40 hover:bg-tinta/5"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rio/20 bg-rio/5 px-4 py-3">
      <span className="text-xl" aria-hidden>
        🔔
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-noche">
        Enterate al toque cuando alguien quiera sumarse a tu salida.
      </p>
      <button
        type="button"
        onClick={activar}
        disabled={trabajando}
        className="shrink-0 rounded-xl bg-rio px-3 py-2 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-60"
      >
        {trabajando ? "..." : "Activar"}
      </button>
      <button
        type="button"
        onClick={descartar}
        aria-label="Cerrar"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-tinta/40 hover:bg-tinta/5"
      >
        ✕
      </button>
    </div>
  );
}
