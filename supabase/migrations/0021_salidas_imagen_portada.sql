-- =============================================================================
-- vamosalrio — 0021: foto de portada (carátula) opcional en las salidas.
-- salidas.imagen_portada: URL pública de la imagen en Supabase Storage
-- (bucket "salidas"). null = sin foto → se muestra un fallback de marca.
-- =============================================================================

alter table public.salidas
  add column if not exists imagen_portada text;
