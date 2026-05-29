-- =============================================================================
-- vamosalrio — RLS: lectura pública de participaciones aceptadas
-- Necesario para mostrar la "tripulación confirmada" (avatares apilados) en
-- /salida/[id] tanto a visitantes anon como a usuarios que no son host ni
-- participantes de esa salida.
--
-- Las policies existentes siguen vigentes (host ve todo, participante ve lo
-- propio). Esta agrega una vista pública SOLO de participaciones con estado
-- 'aceptado'. Pendientes y rechazadas quedan privadas como hasta ahora.
-- =============================================================================

create policy "participaciones_select_aceptadas_publicas"
  on public.participaciones for select
  to anon, authenticated
  using (estado = 'aceptado');
