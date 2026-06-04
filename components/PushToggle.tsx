"use client";

import { usePushNotifications } from "@/lib/push/usePushNotifications";

// Opción permanente en el Perfil para activar/desactivar las notificaciones.
export default function PushToggle() {
  const { estado, trabajando, error, activar, desactivar } =
    usePushNotifications();

  let detalle: string;
  let accion: React.ReactNode = null;

  switch (estado) {
    case "loading":
      detalle = "Cargando...";
      break;
    case "unsupported":
      detalle = "Tu navegador no soporta notificaciones.";
      break;
    case "ios-instalar":
      detalle =
        "📲 Agregá la app a tu inicio y abrila desde el ícono para activar.";
      break;
    case "denied":
      detalle =
        "Están bloqueadas. Habilitalas desde los ajustes del navegador.";
      break;
    case "granted":
      detalle = "Activadas en este dispositivo.";
      accion = (
        <button
          type="button"
          onClick={desactivar}
          disabled={trabajando}
          className="shrink-0 rounded-xl border border-tinta/15 px-3 py-2 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-60"
        >
          {trabajando ? "..." : "Desactivar"}
        </button>
      );
      break;
    default: // "default"
      detalle = "Recibí un aviso cuando pasa algo en tus salidas.";
      accion = (
        <button
          type="button"
          onClick={activar}
          disabled={trabajando}
          className="shrink-0 rounded-xl bg-rio px-3 py-2 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-60"
        >
          {trabajando ? "..." : "Activar"}
        </button>
      );
  }

  return (
    <div className="rounded-2xl border border-tinta/10 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden>
          🔔
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-noche">Notificaciones</p>
          <p className="mt-0.5 text-xs leading-snug text-tinta/60">{detalle}</p>
        </div>
        {accion}
      </div>
      {error ? (
        <p className="mt-2 rounded-xl bg-arena/15 px-3 py-2 text-xs text-arena">
          {error}
        </p>
      ) : null}
    </div>
  );
}
