-- =============================================================================
-- vamosalrio — 0025: throttle del push de chat (anti-spam)
-- Una fila por (salida, usuario) con la última vez que le mandamos push de
-- chat. La server action no manda más de 1 push por usuario por salida dentro
-- de la ventana de throttle (agrupa los mensajes seguidos en uno solo).
-- La escribe SOLO el service-role desde la server action; RLS habilitada sin
-- policies → inaccesible para anon/authenticated.
-- =============================================================================

create table if not exists public.chat_push_estado (
  salida_id      uuid not null references public.salidas(id)  on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  ultimo_push_at timestamptz not null default now(),
  primary key (salida_id, user_id)
);

alter table public.chat_push_estado enable row level security;
