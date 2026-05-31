-- 0015_admin.sql
-- Panel de super administrador.
-- (Va en 0015 porque 0013/0014 ya se usaron para los flags de recordatorio.)
alter table profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists bloqueado boolean not null default false;

-- Para poder marcar reportes como resueltos / desestimados desde el panel.
alter table reportes
  add column if not exists resuelto boolean not null default false;
