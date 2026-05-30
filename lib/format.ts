const TZ = "America/Argentina/Buenos_Aires";

function cap(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function partsFor(d: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour12: false, ...opts }).formatToParts(d);
}

function getPart(parts: Intl.DateTimeFormatPart[], type: string) {
  const p = parts.find((pp) => pp.type === type);
  return p ? p.value.replace(/\./g, "") : "";
}

export function formatFechaCorta(iso: string) {
  const d = new Date(iso);
  const parts = partsFor(d, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dia = cap(getPart(parts, "weekday"));
  const num = getPart(parts, "day");
  const mes = cap(getPart(parts, "month"));
  const hh = getPart(parts, "hour");
  const mm = getPart(parts, "minute");
  return `${dia} ${num} ${mes}, ${hh}:${mm} hs`;
}

export function formatFechaLarga(iso: string) {
  const d = new Date(iso);
  const parts = partsFor(d, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dia = cap(getPart(parts, "weekday"));
  const num = getPart(parts, "day");
  const mes = cap(getPart(parts, "month"));
  const hh = getPart(parts, "hour");
  const mm = getPart(parts, "minute");
  return `${dia} ${num} de ${mes}, ${hh}:${mm} hs`;
}

export function formatPesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export const TRANSPORTE_LABEL: Record<string, string> = {
  lancha_publica: "Lancha pública",
  lancha_privada: "Lancha privada",
  lancha_taxi: "Lancha taxi",
  kayak: "Kayak",
  a_pie: "A pie",
  otro: "Otro",
};

export const CATEGORIAS: { value: string; label: string }[] = [
  { value: "lancha_paseo", label: "Lancha / paseo" },
  { value: "pesca", label: "Pesca" },
  { value: "kayak_remo", label: "Kayak / remo" },
  { value: "playa_isla", label: "Playa / isla" },
  { value: "asado_isla", label: "Asado en isla" },
  { value: "deportes_nauticos", label: "Deportes náuticos" },
];

export const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.value, c.label]),
);
