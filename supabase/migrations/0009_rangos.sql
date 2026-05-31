-- 0009_rangos.sql
-- Sistema de rangos en dos tracks: host y tripulante.
-- Se mantiene profiles.es_capitan por compatibilidad por ahora.
alter table profiles
  add column if not exists rango_host text default null,
  add column if not exists rango_tripulante text default null;
