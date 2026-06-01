-- =============================================================================
-- vamosalrio — 0019: edad y género.
-- profiles.fecha_nacimiento + genero (obligatorios en el alta; barrera +18).
-- salidas.edad_min / edad_max: rango de edad opcional por salida.
-- =============================================================================

alter table public.profiles
  add column if not exists fecha_nacimiento date,
  add column if not exists genero text;

alter table public.salidas
  add column if not exists edad_min int,
  add column if not exists edad_max int;
