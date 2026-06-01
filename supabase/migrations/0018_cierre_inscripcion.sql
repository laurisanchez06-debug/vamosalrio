-- =============================================================================
-- vamosalrio — 0018: cierre de inscripción opcional.
-- salidas.cierre_inscripcion: hasta cuándo se puede pedir sumarse.
-- nullable → null = la inscripción cierra cuando empieza la salida (fecha_hora).
-- =============================================================================

alter table public.salidas
  add column if not exists cierre_inscripcion timestamptz;
