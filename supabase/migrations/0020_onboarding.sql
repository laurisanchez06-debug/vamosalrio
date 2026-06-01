-- =============================================================================
-- vamosalrio — 0020: onboarding de bienvenida.
-- profiles.onboarding_completado: true una vez que el usuario vio (o salteó)
-- el onboarding post-registro, para no repetirlo.
-- =============================================================================

alter table public.profiles
  add column if not exists onboarding_completado boolean not null default false;
