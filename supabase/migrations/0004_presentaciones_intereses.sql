-- =============================================================================
-- vamosalrio — 0004: presentaciones + intereses
-- - profiles.intereses: array de intereses que declara cada usuario.
-- - participaciones.mensaje: presentación que deja el solicitante al host.
-- =============================================================================

alter table public.profiles
  add column if not exists intereses text[] not null default '{}';

alter table public.participaciones
  add column if not exists mensaje text;
