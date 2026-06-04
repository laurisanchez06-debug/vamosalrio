-- Centro de notificaciones: un log unificado de eventos por usuario.
-- Extensible: por ahora se insertan tipos de solicitud, después se sumarán
-- mensajes de chat, cancelaciones, etc.
create table if not exists public.notificaciones (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  tipo             text not null,
  salida_id        uuid references public.salidas(id) on delete cascade,
  actor_id         uuid references public.profiles(id) on delete set null,
  participacion_id uuid references public.participaciones(id) on delete cascade,
  leida            boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists notificaciones_user_created_idx
  on public.notificaciones (user_id, created_at desc);
create index if not exists notificaciones_user_leida_idx
  on public.notificaciones (user_id, leida);

alter table public.notificaciones enable row level security;

-- El dueño ve y marca leídas sus propias notificaciones. El INSERT lo hace solo
-- el service-role desde las server actions (no hay policy de insert para auth).
drop policy if exists notif_select_own on public.notificaciones;
create policy notif_select_own on public.notificaciones
  for select using (auth.uid() = user_id);

drop policy if exists notif_update_own on public.notificaciones;
create policy notif_update_own on public.notificaciones
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
