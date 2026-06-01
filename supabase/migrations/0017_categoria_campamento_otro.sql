-- =============================================================================
-- vamosalrio — 0017: nuevos tipos de salida 'campamento' y 'otro'.
-- salidas.categoria no tenía CHECK (los 6 valores vivían solo en el código).
-- Lo formalizamos con los 8 valores y agregamos tipo_otro para el texto libre
-- cuando categoria = 'otro' (ej: "Avistaje de aves").
-- =============================================================================

alter table public.salidas
  drop constraint if exists salidas_categoria_check;

alter table public.salidas
  add constraint salidas_categoria_check
  check (
    categoria is null
    or categoria in (
      'lancha_paseo',
      'pesca',
      'kayak_remo',
      'playa_isla',
      'asado_isla',
      'deportes_nauticos',
      'campamento',
      'otro'
    )
  );

alter table public.salidas
  add column if not exists tipo_otro text;
