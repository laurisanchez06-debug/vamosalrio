-- =============================================================================
-- vamosalrio — 0006: chat interno por salida (solo tripulación confirmada)
-- Tabla chat_mensajes + RLS (host o participante aceptado) + Realtime.
-- =============================================================================

create table public.chat_mensajes (
  id          uuid primary key default gen_random_uuid(),
  salida_id   uuid not null references public.salidas(id)  on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  texto       text not null,
  created_at  timestamptz not null default now()
);

create index chat_mensajes_salida_created_idx
  on public.chat_mensajes (salida_id, created_at);

alter table public.chat_mensajes enable row level security;

-- ── SELECT: solo host de la salida o participante aceptado ────────────────────
create policy "chat_select_miembros"
  on public.chat_mensajes for select
  to authenticated
  using (
    exists (
      select 1 from public.salidas s
      where s.id = chat_mensajes.salida_id
        and s.host_id = auth.uid()
    )
    or exists (
      select 1 from public.participaciones p
      where p.salida_id = chat_mensajes.salida_id
        and p.user_id  = auth.uid()
        and p.estado   = 'aceptado'
    )
  );

-- ── INSERT: además de ser miembro, user_id = auth.uid() ───────────────────────
create policy "chat_insert_miembros"
  on public.chat_mensajes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1 from public.salidas s
        where s.id = chat_mensajes.salida_id
          and s.host_id = auth.uid()
      )
      or exists (
        select 1 from public.participaciones p
        where p.salida_id = chat_mensajes.salida_id
          and p.user_id  = auth.uid()
          and p.estado   = 'aceptado'
      )
    )
  );

-- ── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.chat_mensajes;
