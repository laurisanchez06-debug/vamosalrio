"use client";

import { useState } from "react";

type TabKey = "info" | "tripulacion" | "aportes" | "chat";

export default function SalidaTabs({
  info,
  tripulacion,
  aportes,
  chat,
  pendientesCount = 0,
  initialTab = "info",
}: {
  info: React.ReactNode;
  tripulacion: React.ReactNode;
  aportes: React.ReactNode;
  chat: React.ReactNode;
  pendientesCount?: number;
  initialTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  function cambiarTab(key: TabKey) {
    setTab(key);
    // Los paneles quedan montados (display:none); al volver a mostrar uno con
    // un mapa Leaflet, un resize lo obliga a repintar los tiles.
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
  }

  const TABS: { key: TabKey; label: string; badge?: number }[] = [
    { key: "info", label: "Info" },
    { key: "tripulacion", label: "Tripulación", badge: pendientesCount },
    { key: "aportes", label: "Aportes" },
    { key: "chat", label: "Chat" },
  ];

  return (
    <div className="mt-6">
      {/* Barra de tabs — pegada arriba al hacer scroll */}
      <div className="sticky top-0 z-20 -mx-6 border-b border-tinta/10 bg-crema/95 px-6 backdrop-blur">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => cambiarTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 px-3 py-3 text-sm font-semibold transition ${
                  active ? "text-rio" : "text-tinta/50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {t.label}
                  {t.badge ? (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-arena px-1 text-[10px] font-bold text-crema">
                      {t.badge}
                    </span>
                  ) : null}
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-rio"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Paneles — se mantienen montados (preserva estado de chat/forms) */}
      <div className="pt-5">
        <div className={tab === "info" ? "" : "hidden"}>{info}</div>
        <div className={tab === "tripulacion" ? "" : "hidden"}>{tripulacion}</div>
        <div className={tab === "aportes" ? "" : "hidden"}>{aportes}</div>
        <div className={tab === "chat" ? "" : "hidden"}>{chat}</div>
      </div>
    </div>
  );
}
