"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIAS,
  categoriaLabel,
  formatFechaCorta,
  formatPesos,
} from "@/lib/format";
import CapitanBadge from "@/components/CapitanBadge";
import PortadaCover from "@/components/PortadaCover";

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
  cierre_inscripcion: string | null;
  punto_encuentro_texto: string | null;
  punto_encuentro_lat: number | null;
  punto_encuentro_lng: number | null;
  cupos_total: number;
  cupos_ocupados: number;
  participantes_minimos: number | null;
  transporte: string;
  categoria: string | null;
  tipo_otro: string | null;
  edad_min: number | null;
  edad_max: number | null;
  costos: Costo[] | null;
  estado: string;
  host_id: string;
  imagen_portada: string | null;
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

const PAGE_SIZE = 10;

export default function FeedClient({ salidas }: { salidas: SalidaFeed[] }) {
  // El feed abre filtrado por "Este finde" por defecto.
  const [fecha, setFecha] = useState<FechaFilter>("finde");
  const [transporte, setTransporte] = useState<TransporteFilter>("todas");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [cerca, setCerca] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  // Cuántas cards mostrar (paginado de a PAGE_SIZE con "Ver más").
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Filtros activos en el panel desplegable (CÓMO + TIPO).
  const filtrosActivos =
    (transporte !== "todas" ? 1 : 0) + categorias.length;

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

  // Al cambiar cualquier filtro/orden, volvemos al primer tramo.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [fecha, transporte, categorias, cerca, pos]);

  const visibles = conDistancia.slice(0, visible);
  const hayMas = conDistancia.length > visible;

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
      <div className="-mx-6 px-6">
        {/* CUÁNDO siempre visible + botón compacto para el resto */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 flex-wrap gap-2">
            {FECHAS.map((opt) => {
              const active = fecha === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFecha(opt.value)}
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
          <button
            type="button"
            onClick={() => setShowFiltros((v) => !v)}
            aria-expanded={showFiltros}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              showFiltros || filtrosActivos > 0
                ? "border-rio bg-rio/10 text-rio"
                : "border-tinta/15 bg-white text-tinta/70"
            }`}
          >
            Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ""}
            <span aria-hidden>{showFiltros ? "▲" : "▼"}</span>
          </button>
        </div>

        {showFiltros ? (
          <div className="mt-3 space-y-2 rounded-2xl border border-tinta/10 bg-white/60 p-3">
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
        ) : null}
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
        fecha === "finde" ? (
          <div className="mt-3 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-8 text-center">
            <p className="text-sm text-tinta/60">
              No hay salidas este finde. Mirá las de esta semana.
            </p>
            <button
              type="button"
              onClick={() => setFecha("semana")}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-rio px-5 text-sm font-semibold text-crema active:scale-[0.98]"
            >
              Ver las de esta semana
            </button>
          </div>
        ) : (
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
        )
      ) : (
        <>
          <ul className="mt-3 space-y-2.5">
            {visibles.map(({ salida, dist }) => (
              <li key={salida.id}>
                <SalidaCard salida={salida} distanciaKm={dist} />
              </li>
            ))}
          </ul>
          {hayMas ? (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-tinta/15 bg-white text-sm font-semibold text-tinta/70 active:scale-[0.98]"
            >
              Ver más ({conDistancia.length - visible} más)
            </button>
          ) : null}
        </>
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
  const tipoLabel = categoriaLabel(salida.categoria, salida.tipo_otro);

  // Restricción de edad: badge discreto (no esconde la salida del feed).
  let edadBadge: string | null = null;
  if (salida.edad_min != null && salida.edad_max != null) {
    edadBadge = `Edad ${salida.edad_min}-${salida.edad_max}`;
  } else if (salida.edad_min != null) {
    edadBadge = `Edad ${salida.edad_min}+`;
  } else if (salida.edad_max != null) {
    edadBadge = `Edad hasta ${salida.edad_max}`;
  }

  return (
    <Link
      href={`/salida/${salida.id}`}
      className="flex gap-3 overflow-hidden rounded-2xl bg-white p-2.5 shadow-sm transition active:scale-[0.99]"
    >
      {/* Thumbnail cuadrado: portada (foto o fallback de marca). El banner
          grande 16:9 queda solo en el detalle de la salida. */}
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl">
        <PortadaCover
          imagenPortada={salida.imagen_portada}
          categoria={salida.categoria}
          tipoOtro={salida.tipo_otro}
          titulo={salida.titulo}
          iconClassName="text-2xl"
          showLabel={false}
        />
      </div>

      {/* Info a la derecha, en columna */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {/* Fila 1: badge tipo + badge estado (+ edad) */}
        <div className="flex items-center gap-1.5">
          {tipoLabel ? (
            <span className="inline-flex max-w-[55%] items-center truncate rounded-full bg-rio/10 px-2 py-0.5 text-[11px] font-semibold text-rio">
              {tipoLabel}
            </span>
          ) : null}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
          >
            {badgeLabel}
          </span>
          {edadBadge ? (
            <span className="ml-auto shrink-0 rounded-full bg-noche/5 px-2 py-0.5 text-[11px] font-semibold text-tinta/60">
              {edadBadge}
            </span>
          ) : null}
        </div>

        {/* Fila 2: host + rating */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-[9px] font-bold text-crema">
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
          </span>
          <span className="truncate text-xs font-medium text-tinta/70">
            {host?.nombre ?? "Anónimo"}
          </span>
          {host?.es_capitan ? <CapitanBadge /> : null}
          <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[11px] text-tinta/50">
            <span aria-hidden className="text-arena">
              ★
            </span>
            {reputacion.toFixed(1)}
          </span>
        </div>

        {/* Fila 3: título */}
        <h3 className="mt-1 truncate text-sm font-semibold leading-tight text-noche">
          {salida.titulo}
        </h3>

        {/* Fila 4: fecha · lugar (una línea) */}
        <div className="mt-1 flex items-center gap-1 text-[11px] text-tinta/60">
          <span aria-hidden>📅</span>
          <span className="shrink-0">{formatFechaCorta(salida.fecha_hora)}</span>
          {salida.punto_encuentro_texto ? (
            <>
              <span aria-hidden className="text-tinta/30">
                ·
              </span>
              <span aria-hidden>📍</span>
              <span className="truncate">{salida.punto_encuentro_texto}</span>
            </>
          ) : null}
          {distanciaKm != null ? (
            <span className="shrink-0 font-medium text-noche/70">
              · {fmtKm(distanciaKm)}
            </span>
          ) : null}
        </div>

        {/* Fila 5: disponibilidad + costo */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tinta/10">
            <div
              className="h-full rounded-full bg-rio transition-all"
              style={{ width: `${ocupadoPct}%` }}
              aria-hidden
            />
          </div>
          <span className="shrink-0 text-[11px] text-tinta/60">
            {cuposLibres}/{salida.cupos_total}
          </span>
          {total > 0 ? (
            <span className="shrink-0 text-[11px] font-semibold text-rio">
              {formatPesos(porPersona)}
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-tinta/50">Gratis</span>
          )}
        </div>
      </div>
    </Link>
  );
}
