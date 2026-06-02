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

export const GENEROS = ["Mujer", "Varón", "Otro", "Prefiero no decir"] as const;

// Edad (en años cumplidos) a partir de la fecha de nacimiento (YYYY-MM-DD).
export function calcularEdad(
  fechaNacimiento: string | null | undefined,
): number | null {
  if (!fechaNacimiento) return null;
  const d = new Date(fechaNacimiento);
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--;
  return edad;
}

// Texto del rango de edad de una salida ("de X a Y años", etc.). null si no hay.
export function rangoEdadLabel(
  edadMin: number | null | undefined,
  edadMax: number | null | undefined,
): string | null {
  if (edadMin != null && edadMax != null) return `de ${edadMin} a ${edadMax} años`;
  if (edadMin != null) return `de ${edadMin} años o más`;
  if (edadMax != null) return `hasta ${edadMax} años`;
  return null;
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
  { value: "campamento", label: "Campamento" },
  { value: "otro", label: "Otro" },
];

export const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.value, c.label]),
);

// Ícono (emoji) por tipo de salida — usado en el wizard y en el fallback de
// portada cuando no hay foto cargada.
export const CATEGORIA_EMOJI: Record<string, string> = {
  lancha_paseo: "🚤",
  pesca: "🎣",
  kayak_remo: "🛶",
  playa_isla: "🏖️",
  asado_isla: "🔥",
  deportes_nauticos: "🏄",
  campamento: "⛺",
  otro: "✨",
};

export function categoriaEmoji(categoria: string | null | undefined): string {
  if (!categoria) return "🌊";
  return CATEGORIA_EMOJI[categoria] ?? "🌊";
}

// Texto a mostrar para el tipo de salida. Para 'otro', usa el texto libre
// que cargó el host (tipo_otro); si falta, cae a "Otro".
export function categoriaLabel(
  categoria: string | null | undefined,
  tipoOtro?: string | null,
): string | null {
  if (!categoria) return null;
  if (categoria === "otro") return tipoOtro?.trim() || "Otro";
  return CATEGORIA_LABEL[categoria] ?? categoria;
}
