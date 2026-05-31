-- 0010_cancelaciones_tardias.sql
-- Contador de bajas de último momento (≤48hs) por usuario. Visible para hosts.
alter table profiles
  add column if not exists cancelaciones_tardias int not null default 0;
