"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  TRANSPORTE_LABEL,
  formatFechaCorta,
  formatPesos,
} from "@/lib/format";
import CapitanBadge from "@/components/CapitanBadge";

type Host = {
  nombre: string | null;
  foto_url: string | null;
  reputacion_promedio: number | null;
  es_capitan: boolean | null;
};

type Costo = { concepto: string; monto: number };

export type SalidaFeed = {
  id: string;
  titulo: string;
  fecha_hora: string;
  punto_encuentro_texto: string | null;
  punto_encuentro_lat: number | null;
  punto_encuentro_lng: number | null;
  cupos_total: number;
  cupos_ocupados: number;
  transporte: string;
  categoria: string | null;
  costos: Costo[] | null;
  estado: string;
  host_id: string;
  host: Host | Host[] | null;
};

type FechaFilter = "todas" | "hoy" | "finde" | "semana" | "mes";
type TransporteFilter = "todas" | "lancha" | "kayak" | "a_pie";
type GeoState = "idle" | "loading" | "on" | "denied" | "unsupported";

const FECHAS: { value: FechaFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "hoy", label: "Hoy" },
  { value: "finde", label: "Este finde" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
];

const TRANSPORTES: { value: TransporteFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "lancha", label: "Lancha" },
  { value: "kayak", label: "Kayak" },
  { value: "a_pie", label: "A pie" },
];

function getHost(s: SalidaFeed): Host | null {
  if (!s.host) return null;
  if (Array.isArray(s.host)) return s.host[0] ?? null;
  return s.host;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function matchFecha(iso: string, filter: FechaFilter): boolean {
  if (filter === "todas") return true;
  const date = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const dowMon = (now.getDay() + 6) % 7; // 0 = lunes … 6 = domingo

  if (filter === "hoy") {
    const manana = new Date(today);
    manana.setDate(today.getDate() + 1);
    return date >= today && date < manana;
  }
  if (filter === "finde") {
    const lunes = new Date(today);
    lunes.setDate(today.getDate() - dowMon);
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    const proxLunes = new Date(lunes);
    proxLunes.setDate(lunes.getDate() + 7);
    return date >= sabado && date < proxLunes;
  }
  if (filter === "semana") {
    const proxLunes = new Date(today);
    proxLunes.setDate(today.getDate() - dowMon + 7);
    return date >= today && date < proxLunes;
  }
  if (filter === "mes") {
    const proxMes = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return date >= today && date < proxMes;
  }
  return true;
}

function transporteMatch(t: string, filter: TransporteFilter): boolean {
  if (filter === "todas") return true;
  if (filter === "lancha") return t?.startsWith("lancha");
  return t === filter;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtKm(km: number): string {
  if (km < 1) return `a ${Math.round(km * 1000)} m`;
  return `a ${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
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
  const [categorias, setCategorias] = useState<string[]>([]);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [cerca, setCerca] = useState(false);

  function toggleCategoria(value: string) {
    setCategorias((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function pedirUbicacion() {
    if (pos) {
      setCerca((c) => !c);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("unsupported");
      return;
    }
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setCerca(true);
        setGeo("on");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const filtradas = useMemo(() => {
    return salidas.filter((s) => {
      if (!matchFecha(s.fecha_hora, fecha)) return false;
      if (!transporteMatch(s.transporte, transporte)) return false;
      if (categorias.length > 0 && !categorias.includes(s.categoria ?? ""))
        return false;
      return true;
    });
  }, [salidas, fecha, transporte, categorias]);

  const conDistancia = useMemo(() => {
    const arr = filtradas.map((s) => ({
      salida: s,
      dist:
        pos && s.punto_encuentro_lat != null && s.punto_encuentro_lng != null
          ? haversineKm(
              pos.lat,
              pos.lng,
              s.punto_encuentro_lat,
              s.punto_encuentro_lng,
            )
          : null,
    }));
    if (cerca && pos) {
      arr.sort((a, b) => {
        if (a.dist == null && b.dist == null) return 0;
        if (a.dist == null) return 1;
        if (b.dist == null) return -1;
        return a.dist - b.dist;
      });
    }
    return arr;
  }, [filtradas, pos, cerca]);

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

  const cercaActivo = cerca && !!pos;

  return (
    <div className="mt-6">
      <div className="-mx-6 space-y-2 px-6">
        <ChipGroup
          label="Cuándo"
          value={fecha}
          onChange={(v) => setFecha(v as FechaFilter)}
          options={FECHAS}
        />
        <ChipGroup
          label="Cómo"
          value={transporte}
          onChange={(v) => setTransporte(v as TransporteFilter)}
          options={TRANSPORTES}
        />
        <MultiChipGroup
          label="Tipo"
          selected={categorias}
          onToggle={toggleCategoria}
          onClear={() => setCategorias([])}
          options={CATEGORIAS}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={pedirUbicacion}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            cercaActivo
              ? "border-rio bg-rio text-crema"
              : "border-tinta/15 bg-white text-tinta/70"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4.5 8-11a8 8 0 1 0-16 0c0 6.5 8 11 8 11z" />
            <circle cx="12" cy="11" r="2.5" />
          </svg>
          {geo === "loading"
            ? "Buscando…"
            : cercaActivo
              ? "Cerca mío ✓"
              : "Cerca mío"}
        </button>
        {geo === "denied" ? (
          <span className="text-xs text-tinta/50">
            No pudimos acceder a tu ubicación.
          </span>
        ) : null}
        {geo === "unsupported" ? (
          <span className="text-xs text-tinta/50">
            Tu navegador no comparte ubicación.
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm font-medium text-tinta/60">
        {conDistancia.length}{" "}
        {conDistancia.length === 1 ? "salida" : "salidas"}
        {cercaActivo ? " · más cercanas primero" : ""}
      </p>

      {conDistancia.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-8 text-center">
          <p className="text-sm text-tinta/60">
            Ninguna salida coincide con esos filtros.
          </p>
          <button
            type="button"
            onClick={() => {
              setFecha("todas");
              setTransporte("todas");
              setCategorias([]);
            }}
            className="mt-3 text-sm font-semibold text-rio"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {conDistancia.map(({ salida, dist }) => (
            <li key={salida.id}>
              <SalidaCard salida={salida} distanciaKm={dist} />
            </li>
          ))}
        </ul>
      )}
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
      <span className="w-14 shrink-0 text-[11px] uppercase tracking-wide text-tinta/40">
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

function MultiChipGroup({
  label,
  selected,
  onToggle,
  onClear,
  options,
}: {
  label: string;
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-14 shrink-0 text-[11px] uppercase tracking-wide text-tinta/40">
        {label}
      </span>
      <div className="flex flex-1 flex-wrap gap-2">
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-tinta/15 bg-white px-3 py-1.5 text-xs font-medium text-tinta/50"
          >
            Todas
          </button>
        ) : (
          <span className="rounded-full border border-rio bg-rio px-3 py-1.5 text-xs font-medium text-crema">
            Todas
          </span>
        )}
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
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

function SalidaCard({
  salida,
  distanciaKm,
}: {
  salida: SalidaFeed;
  distanciaKm: number | null;
}) {
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
  const categoriaLabel = salida.categoria
    ? CATEGORIA_LABEL[salida.categoria] ?? salida.categoria
    : null;

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
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-noche">
              {host?.nombre ?? "Anónimo"}
            </span>
            {host?.es_capitan ? <CapitanBadge /> : null}
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

      {categoriaLabel || distanciaKm != null ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {categoriaLabel ? (
            <span className="inline-flex items-center rounded-full bg-rio/10 px-2.5 py-0.5 text-[11px] font-semibold text-rio">
              {categoriaLabel}
            </span>
          ) : null}
          {distanciaKm != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-noche/5 px-2.5 py-0.5 text-[11px] font-semibold text-noche">
              📍 {fmtKm(distanciaKm)}
            </span>
          ) : null}
        </div>
      ) : null}

      <h3 className="mt-2 text-lg font-semibold leading-tight text-noche">
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
          <dd>{TRANSPORTE_LABEL[salida.transporte] ?? salida.transporte}</dd>
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
