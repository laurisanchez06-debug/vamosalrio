-- 0016 — Salidas privadas (solo accesibles por link, nunca aparecen en el feed).
alter table public.salidas
  add column if not exists es_privada boolean not null default false;
