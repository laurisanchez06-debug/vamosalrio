"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

type Props = {
  titulo: string;
  fechaTexto: string;
  punto: string | null;
  cuposLibres: number;
};

function buildMensaje({
  titulo,
  fechaTexto,
  punto,
  cuposLibres,
}: Props) {
  const piezas = [
    `¡Mirá esta salida al río! ${titulo}`,
    `el ${fechaTexto}`,
  ];
  if (punto) piezas.push(`en ${punto}`);
  return `${piezas.join(" ")}. Quedan ${cuposLibres} cupos libres. Sumate:`;
}

function getURL() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function IconoCompartirHeader(props: Props) {
  async function onClick() {
    const url = getURL();
    const text = buildMensaje(props);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: props.titulo, text, url });
        return;
      } catch {
        // cancelado o no soportado: fallback a WhatsApp
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Compartir salida"
      className="grid h-10 w-10 place-items-center rounded-full bg-white text-noche shadow-sm"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    </button>
  );
}

export function BotonesCompartir({
  destacado = false,
  ...props
}: Props & { destacado?: boolean }) {
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "error" } | null>(
    null,
  );

  function showToast(msg: string, tipo: "info" | "error" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2000);
  }

  function shareWhatsApp() {
    const url = getURL();
    const text = buildMensaje(props);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getURL());
      showToast("Link copiado ✓");
    } catch {
      showToast("No pudimos copiar el link", "error");
    }
  }

  if (destacado) {
    return (
      <div className="mt-6 rounded-2xl border border-rio/30 bg-rio/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-noche">
          🔒 Salida privada
        </div>
        <p className="mt-1 text-sm text-tinta/70">
          Compartí el link con quien quieras invitar. No aparece en el feed.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-crema active:scale-[0.98]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 2.09.55 4.08 1.6 5.86L2 22l4.39-1.15a9.86 9.86 0 0 0 5.65 1.78h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.05a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-2.6.68.69-2.54-.19-.32a8.13 8.13 0 0 1-1.26-4.36c0-4.51 3.68-8.18 8.19-8.18s8.18 3.67 8.18 8.18-3.67 8.18-8.18 8.18zm4.49-6.13c-.25-.12-1.45-.71-1.68-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.24a7.49 7.49 0 0 1-1.38-1.72c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.75-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.41.06-.63.31s-.83.81-.83 1.98c0 1.17.85 2.3.97 2.46.12.16 1.67 2.55 4.05 3.58.57.25 1.01.4 1.36.51.57.18 1.09.16 1.5.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
            </svg>
            WhatsApp
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-noche active:scale-[0.98]"
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
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copiar link
          </button>
        </div>
        {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="text-[11px] uppercase tracking-wide text-tinta/40">
        Compartir
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-crema active:scale-[0.98]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 2.09.55 4.08 1.6 5.86L2 22l4.39-1.15a9.86 9.86 0 0 0 5.65 1.78h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.05a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-2.6.68.69-2.54-.19-.32a8.13 8.13 0 0 1-1.26-4.36c0-4.51 3.68-8.18 8.19-8.18s8.18 3.67 8.18 8.18-3.67 8.18-8.18 8.18zm4.49-6.13c-.25-.12-1.45-.71-1.68-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.24a7.49 7.49 0 0 1-1.38-1.72c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.75-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.41.06-.63.31s-.83.81-.83 1.98c0 1.17.85 2.3.97 2.46.12.16 1.67 2.55 4.05 3.58.57.25 1.01.4 1.36.51.57.18 1.09.16 1.5.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
          </svg>
          WhatsApp
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-noche active:scale-[0.98]"
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Copiar link
        </button>
      </div>
      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </div>
  );
}
