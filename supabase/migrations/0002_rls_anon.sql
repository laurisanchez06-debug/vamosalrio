-- =============================================================================
-- vamosalrio — RLS pública para compartir el detalle de salida
-- Habilita SELECT al rol `anon` en salidas (salvo canceladas) y en profiles.
-- El código solo va a pedir columnas públicas del profile:
--   id, nombre, foto_url, reputacion_promedio, verificado
-- =============================================================================

-- salidas: anon ve cualquier salida salvo las canceladas.
create policy "salidas_select_anon"
  on public.salidas for select
  to anon
  using (estado <> 'cancelada');

-- profiles: anon ve los profiles (necesario para mostrar al host en el detalle
-- público compartido por link).
create policy "profiles_select_anon"
  on public.profiles for select
  to anon
  using (true);
