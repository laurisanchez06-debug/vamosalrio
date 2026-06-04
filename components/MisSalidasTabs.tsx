"use client";

import { useState } from "react";
import Link from "next/link";
import { formatFechaCorta } from "@/lib/format";

export type MiSalida = {
  id: string;
  titulo: string;
  fecha_hora: string;
  estado: string;
  cupos_total: number;
  cupos_ocupados: number;
  hostNombre: string | null;
  pasada: boolean;
  necesitaFinalizar: boolean;
  pendienteCalificar: boolean;
};

type TabKey = "organizadas" | "participando" | "solicitudes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "organizadas", label: "Organizadas" },
  { key: "participando", label: "Participando" },
  { key: "solicitudes", label: "Mis pedidos" },
];

const ESTADO: Record<string, { label: string; className: string }> = {
  abierta: { label: "Abierta", className: "bg-rio/10 text-rio" },
  completa: { label: "Completa", className: "bg-arena/20 text-arena" },
  cerrada: { label: "Cerrada", className: "bg-tinta/10 text-tinta/70" },
  finalizada: { label: "Finalizada", className: "bg-noche/10 text-noche" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-600" },
};

function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADO[estado] ?? { label: estado, className: "bg-tinta/10 text-tinta/70" };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${e.className}`}
    >
      {e.label}
    </span>
  );
}

export default function MisSalidasTabs({
  organizadas,
  participando,
  solicitudes,
}: {
  organizadas: MiSalida[];
  participando: MiSalida[];
  solicitudes: MiSalida[];
}) {
  const [tab, setTab] = useState<TabKey>("organizadas");
  const data: Record<TabKey, MiSalida[]> = { organizadas, participando, solicitudes };

  return (
    <div className="px-6 pb-6 pt-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-noche">Mis salidas</h1>
        <p className="mt-2 text-tinta/70">Las que armaste y a las que te sumaste.</p>
      </header>

      <div className="mt-6 flex gap-1 rounded-2xl bg-tinta/5 p-1 text-sm">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = data[t.key].length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl px-2 py-2 font-medium transition ${
                active ? "bg-white text-noche shadow-sm" : "text-tinta/60"
              }`}
            >
              {t.label}
              {count > 0 ? (
                <span className="ml-1 text-xs text-tinta/40">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "organizadas" ? <Organizadas items={organizadas} /> : null}
        {tab === "participando" ? <Participando items={participando} /> : null}
        {tab === "solicitudes" ? <Solicitudes items={solicitudes} /> : null}
      </div>
    </div>
  );
}

function EmptyState({
  mensaje,
  cta,
}: {
  mensaje: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="text-sm text-tinta/60">{mensaje}</p>
      <Link
        href={cta.href}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-rio px-5 text-sm font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98]"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function Organizadas({ items }: { items: MiSalida[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        mensaje="Todavía no organizaste salidas."
        cta={{ href: "/salida/nueva", label: "Crear una salida" }}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <Link href={`/salida/${s.id}`} className="block">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-noche">{s.titulo}</h3>
              <EstadoBadge estado={s.estado} />
            </div>
            <p className="mt-1 text-sm text-tinta/60">{formatFechaCorta(s.fecha_hora)}</p>
            <p className="mt-2 text-xs font-medium text-tinta/50">
              {s.cupos_ocupados}/{s.cupos_total} cupos
            </p>
          </Link>
          {s.necesitaFinalizar ? (
            <div className="mt-3 rounded-xl bg-arena/15 p-3 text-xs text-arena">
              <p className="font-medium">
                Terminó. Finalizala para habilitar las calificaciones.
              </p>
              <Link
                href={`/salida/${s.id}`}
                className="mt-1 inline-block font-semibold underline"
              >
                Ir a finalizar →
              </Link>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Participando({ items }: { items: MiSalida[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        mensaje="Todavía no te sumaste a ninguna salida."
        cta={{ href: "/feed", label: "Explorar salidas" }}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <Link href={`/salida/${s.id}`} className="block">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-noche">{s.titulo}</h3>
              <EstadoBadge estado={s.estado} />
            </div>
            {s.hostNombre ? (
              <p className="mt-1 text-sm text-tinta/60">Organiza {s.hostNombre}</p>
            ) : null}
            <p className="mt-1 text-sm text-tinta/60">{formatFechaCorta(s.fecha_hora)}</p>
          </Link>
          {s.pendienteCalificar ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-rio/10 p-3 text-xs text-rio">
              <span className="rounded-full bg-rio/15 px-2 py-0.5 font-semibold">
                Pendiente de calificar
              </span>
              <Link
                href={`/salida/${s.id}/calificar`}
                className="font-semibold underline"
              >
                Calificar →
              </Link>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function Solicitudes({ items }: { items: MiSalida[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        mensaje="No tenés solicitudes pendientes."
        cta={{ href: "/feed", label: "Explorar salidas" }}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/salida/${s.id}`}
            className="block rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-noche">{s.titulo}</h3>
              <span className="shrink-0 rounded-full bg-arena/20 px-2.5 py-0.5 text-xs font-medium text-arena">
                Esperando confirmación
              </span>
            </div>
            {s.hostNombre ? (
              <p className="mt-1 text-sm text-tinta/60">Organiza {s.hostNombre}</p>
            ) : null}
            <p className="mt-1 text-sm text-tinta/60">{formatFechaCorta(s.fecha_hora)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
