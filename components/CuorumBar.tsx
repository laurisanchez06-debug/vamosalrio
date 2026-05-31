// Muestra el progreso hacia el cuórum mínimo de una salida.
// - Sin mínimo (null): no renderiza nada.
// - Aún sin cuórum: "X de Y mínimo" + barra secundaria ámbar.
// - Con cuórum (aceptados >= mínimo): chip verde "✅ ¡Cuórum!".
export default function CuorumBar({
  aceptados,
  minimo,
  className = "",
}: {
  aceptados: number;
  minimo: number | null | undefined;
  className?: string;
}) {
  if (minimo == null) return null;

  if (aceptados >= minimo) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ${className}`}
      >
        ✅ ¡Cuórum!
      </span>
    );
  }

  const pct = minimo > 0 ? Math.min(100, Math.round((aceptados / minimo) * 100)) : 0;
  return (
    <div className={className}>
      <div className="text-[11px] font-semibold text-arena">
        {aceptados} de {minimo} mínimo
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-arena/15">
        <div
          className="h-full rounded-full bg-arena transition-all"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
