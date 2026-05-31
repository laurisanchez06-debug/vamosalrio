-- 0013_recordatorio_24h.sql
-- Marca si ya se envió el recordatorio de 24hs a cada participante aceptado.
-- (Va en 0013 porque 0012 ya se usó para el estado 'cancelado'.)
alter table participaciones
  add column if not exists recordatorio_24h_enviado boolean not null default false;
