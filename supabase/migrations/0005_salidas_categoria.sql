-- =============================================================================
-- vamosalrio — 0005: tipo de salida (categoría)
-- salidas.categoria: tipo de salida elegido por el host.
-- Valores esperados: 'lancha_paseo', 'pesca', 'kayak_remo', 'playa_isla',
--                    'asado_isla', 'deportes_nauticos'.
-- =============================================================================

alter table public.salidas
  add column if not exists categoria text;
