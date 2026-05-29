"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  TRANSPORTE_LABEL,
  formatFechaCorta,
  formatPesos,
} from "@/lib/format";

type Host = {
  nombre: string | null;
  foto_url: string | null;
  reputacion_promedio: number | null;
};

type Costo = { concepto: string; monto: number };

export type SalidaFeed = {
  id: string;
  titulo: string;
  fecha_hora: string;
  punto_encuentro_texto: string | null;
  cupos_total: number;
  cupos_ocupados: number;
  transporte: string;
  costos: Costo[] | null;
  estado: string;
  host_id: string;
  host: Host | Host[] | null;
};

type FechaFilter = "todas" | "hoy" | "semana";
type TransporteFilter = "todas" | "lancha" | "kayak" | "a_pie";

function getHost(s: SalidaFeed): Host | null {
  if (!s.host) return null;
  if (Array.isArray(s.host)) return s.host[0] ?? null;
  return s.host;
}

function isHoy(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isEstaSemana(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function transporteMatch(t: string, filter: TransporteFilter): boolean {
  if (filter === "todas") return true;
  if (filter === "lancha") return t.startsWith("lancha");
  return t === filter;
}

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function FeedClient({ salidas }: { salidas: SalidaFeed[] }) {
  const [fecha, setFecha] = useState<FechaFilter>("todas");
  const [transporte, setTransporte] = useState<TransporteFilter>("todas");

  const filtradas = useMemo(() => {
    return salidas.filter((s) => {
      if (fecha === "hoy" && !isHoy(s.fecha_hora)) return false;
      if (fecha === "semana" && !isEstaSemana(s.fecha_hora)) return false;
      if (!transporteMatch(s.transporte, transporte)) return false;
      return true;
    });
  }, [salidas, fecha, transporte]);

  if (salidas.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-tinta/20 bg-white/50 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rio/15 text-2xl">
          🌊
        </div>
        <h2 className="mt-4 text-lg font-semibold text-noche">
          Todavía no hay salidas
        </h2>
        <p className="mt-2 text-sm text-tinta/60">
          Sé el primero en armar una y la gente se anota.
        </p>
        <Link
          href="/salida/nueva"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-rio px-5 text-sm font-semibold text-crema"
        >
          Abrí la primera salida
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Filtros
        fecha={fecha}
        setFecha={setFecha}
        transporte={transporte}
        setTransporte={setTransporte}
      />

      {filtradas.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-6 text-center text-sm text-tinta/60">
          Ninguna salida coincide con esos filtros.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtradas.map((s) => (
            <li key={s.id}>
              <SalidaCard salida={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtros({
  fecha,
  setFecha,
  transporte,
  setTransporte,
}: {
  fecha: FechaFilter;
  setFecha: (v: FechaFilter) => void;
  transporte: TransporteFilter;
  setTransporte: (v: TransporteFilter) => void;
}) {
  return (
    <div className="-mx-6 space-y-2 overflow-x-auto px-6">
      <ChipGroup
        label="Cuándo"
        value={fecha}
        onChange={(v) => setFecha(v as FechaFilter)}
        options={[
          { value: "todas", label: "Todas" },
          { value: "hoy", label: "Hoy" },
          { value: "semana", label: "Esta semana" },
        ]}
      />
      <ChipGroup
        label="Cómo"
        value={transporte}
        onChange={(v) => setTransporte(v as TransporteFilter)}
        options={[
          { value: "todas", label: "Todas" },
          { value: "lancha", label: "Lancha" },
          { value: "kayak", label: "Kayak" },
          { value: "a_pie", label: "A pie" },
        ]}
      />
    </div>
  );
}

function ChipGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-tinta/40">
        {label}
      </span>
      <div className="flex flex-1 flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-rio bg-rio text-crema"
                  : "border-tinta/15 bg-white text-tinta/70"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SalidaCard({ salida }: { salida: SalidaFeed }) {
  const host = getHost(salida);
  const cuposLibres = Math.max(
    0,
    salida.cupos_total - (salida.cupos_ocupados ?? 0),
  );
  const ratio = salida.cupos_total > 0 ? cuposLibres / salida.cupos_total : 0;
  const ocupadoPct = Math.min(
    100,
    Math.round(
      ((salida.cupos_total - cuposLibres) / Math.max(1, salida.cupos_total)) *
        100,
    ),
  );

  const total = (salida.costos ?? []).reduce(
    (s, c) => s + (Number(c?.monto) || 0),
    0,
  );
  const porPersona =
    salida.cupos_total > 0 ? Math.ceil(total / salida.cupos_total) : 0;

  let badgeLabel = "Abierta";
  let badgeClass = "bg-rio/15 text-rio";
  if (cuposLibres === 0 || salida.estado === "completa") {
    badgeLabel = "Completa";
    badgeClass = "bg-tinta/10 text-tinta/60";
  } else if (ratio <= 0.3) {
    badgeLabel = "Últimos cupos";
    badgeClass = "bg-arena/15 text-arena";
  }

  const reputacion = Number(host?.reputacion_promedio ?? 0);

  return (
    <Link
      href={`/salida/${salida.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-sm font-bold text-crema">
          {host?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={host.foto_url}
              alt={host?.nombre ?? "Host"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials(host?.nombre)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-noche">
            {host?.nombre ?? "Anónimo"}
          </div>
          <div className="flex items-center gap-1 text-xs text-tinta/50">
            <span aria-hidden className="text-arena">
              ★
            </span>
            <span>{reputacion.toFixed(1)}</span>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
        >
          {badgeLabel}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-tight text-noche">
        {salida.titulo}
      </h3>

      <dl className="mt-3 space-y-1 text-sm text-tinta/70">
        <div className="flex items-center gap-2">
          <span aria-hidden>📅</span>
          <dd>{formatFechaCorta(salida.fecha_hora)}</dd>
        </div>
        {salida.punto_encuentro_texto ? (
          <div className="flex items-center gap-2">
            <span aria-hidden>📍</span>
            <dd className="truncate">{salida.punto_encuentro_texto}</dd>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span aria-hidden>🛶</span>
          <dd>
            {TRANSPORTE_LABEL[salida.transporte] ?? salida.transporte}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-tinta/60">
          <span>
            {cuposLibres} de {salida.cupos_total} disponibles
          </span>
          {total > 0 ? (
            <span className="font-semibold text-rio">
              {formatPesos(porPersona)} por persona
            </span>
          ) : (
            <span className="text-tinta/50">Sin costo</span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-tinta/10">
          <div
            className="h-full rounded-full bg-rio transition-all"
            style={{ width: `${ocupadoPct}%` }}
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
