// Badge dinámico de rango (dos tracks: host y tripulante).
// Recibe el valor crudo de profiles.rango_host / profiles.rango_tripulante.
type RangoInfo = { emoji: string; label: string; className: string; title: string };

const RANGOS: Record<string, RangoInfo> = {
  // ── Host ──────────────────────────────────────────────────────────────
  anfitrion_junior: {
    emoji: "🌱",
    label: "Anfitrión Junior",
    className: "bg-emerald-100 text-emerald-700",
    title: "Organizó su primera salida",
  },
  capitan: {
    emoji: "⚓",
    label: "Capitán",
    className: "bg-noche text-crema",
    title: "≥3 salidas finalizadas como host y buena reputación",
  },
  capitan_maestro: {
    emoji: "⭐",
    label: "Capitán Maestro",
    className: "bg-amber-600 text-white",
    title: "≥10 salidas finalizadas como host y muy buena reputación",
  },
  gran_capitan: {
    emoji: "🏆",
    label: "Gran Capitán",
    className: "bg-yellow-400 text-noche",
    title: "≥25 salidas finalizadas como host y reputación excelente",
  },
  // ── Tripulante ────────────────────────────────────────────────────────
  tripulante: {
    emoji: "🌊",
    label: "Tripulante",
    className: "bg-rio/15 text-rio",
    title: "Se sumó a su primera salida",
  },
  tripulante_experto: {
    emoji: "🌊",
    label: "Tripulante Experto",
    className: "bg-rio text-crema",
    title: "≥5 salidas finalizadas como invitado y buena reputación",
  },
  tripulante_veterano: {
    emoji: "🏄",
    label: "Tripulante Veterano",
    className: "bg-sky-800 text-crema",
    title: "≥15 salidas finalizadas como invitado y muy buena reputación",
  },
};

export default function RangoBadge({
  rango,
  className = "",
}: {
  rango: string | null | undefined;
  className?: string;
}) {
  if (!rango) return null;
  const info = RANGOS[rango];
  if (!info) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.className} ${className}`}
      title={info.title}
    >
      <span aria-hidden>{info.emoji}</span> {info.label}
    </span>
  );
}
