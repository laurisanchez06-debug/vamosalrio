-- =============================================================================
-- vamosalrio — 0008: Capitán (badge de confianza) + referencias escritas
-- - profiles.es_capitan: badge derivado (se recalcula server-side, no por trigger).
-- - calificaciones.comentario: referencia escrita opcional (ya existía en 0001;
--   el IF NOT EXISTS lo hace idempotente).
-- =============================================================================

alter table public.profiles
  add column if not exists es_capitan boolean not null default false;

alter table public.calificaciones
  add column if not exists comentario text;
