-- 0012_participaciones_cancelado.sql
-- Permite el estado 'cancelado' en participaciones: un invitado aceptado que
-- se baja de la salida. (Antes el CHECK solo permitía pendiente/aceptado/rechazado.)
alter table participaciones
  drop constraint if exists participaciones_estado_check;
alter table participaciones
  add constraint participaciones_estado_check
  check (estado in ('pendiente', 'aceptado', 'rechazado', 'cancelado'));
