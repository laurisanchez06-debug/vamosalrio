-- 0011_participantes_minimos.sql
-- Cuórum mínimo opcional para que la salida "salga". Nullable; si es null no hay
-- mínimo. Debe ser <= cupos_total.
alter table salidas
  add column if not exists participantes_minimos int;

alter table salidas
  drop constraint if exists salidas_participantes_minimos_check;
alter table salidas
  add constraint salidas_participantes_minimos_check
  check (
    participantes_minimos is null
    or (participantes_minimos >= 0 and participantes_minimos <= cupos_total)
  );
