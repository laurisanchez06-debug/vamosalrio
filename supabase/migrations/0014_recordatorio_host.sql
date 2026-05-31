-- 0014_recordatorio_host.sql
-- Marca si ya se envió el recordatorio de 24hs al HOST (independiente del de
-- los participantes), para no mandárselo dos veces.
alter table salidas
  add column if not exists recordatorio_host_enviado boolean not null default false;
