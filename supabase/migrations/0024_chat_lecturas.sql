-- =============================================================================
-- vamosalrio — 0024: lecturas del chat ("visto por" estilo grupo de WhatsApp)
-- Una fila por (salida, usuario) que apunta al ÚLTIMO mensaje leído + cuándo.
-- Sirve para dos cosas:
--   1) Avatares de "visto" en el chat (leido_at >= created_at del mensaje).
--   2) Anti-spam del push de chat: si leido_at es muy reciente, el usuario está
--      mirando el chat ahora → no le mandamos push (ver lib/push de chat).
-- =============================================================================

create table if not exists public.chat_lecturas (
  salida_id  uuid not null references public.salidas(id)  on delete cascade,
  mensaje_id uuid not null references public.chat_mensajes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  leido_at   timestamptz not null default now(),
  primary key (salida_id, user_id)
);

create index if not exists chat_lecturas_salida_idx
  on public.chat_lecturas (salida_id);

alter table public.chat_lecturas enable row level security;

-- Helper de membresía (host o participante aceptado de la salida). Reutiliza la
-- misma lógica que las policies de chat_mensajes (0006).
-- ── SELECT: cualquier miembro de la salida ve las marcas de toda la tripulación
drop policy if exists chat_lecturas_select_miembros on public.chat_lecturas;
create policy chat_lecturas_select_miembros
  on public.chat_lecturas for select
  to authenticated
  using (
    exists (
      select 1 from public.salidas s
      where s.id = chat_lecturas.salida_id
        and s.host_id = auth.uid()
    )
    or exists (
      select 1 from public.participaciones p
      where p.salida_id = chat_lecturas.salida_id
        and p.user_id  = auth.uid()
        and p.estado   = 'aceptado'
    )
  );

-- ── INSERT: solo la marca propia, y siendo miembro de la salida ───────────────
drop policy if exists chat_lecturas_insert_propia on public.chat_lecturas;
create policy chat_lecturas_insert_propia
  on public.chat_lecturas for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1 from public.salidas s
        where s.id = chat_lecturas.salida_id
          and s.host_id = auth.uid()
      )
      or exists (
        select 1 from public.participaciones p
        where p.salida_id = chat_lecturas.salida_id
          and p.user_id  = auth.uid()
          and p.estado   = 'aceptado'
      )
    )
  );

-- ── UPDATE: solo la marca propia (avanzar el último mensaje leído) ────────────
drop policy if exists chat_lecturas_update_propia on public.chat_lecturas;
create policy chat_lecturas_update_propia
  on public.chat_lecturas for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Realtime: para que los avatares de "visto" se actualicen en vivo ──────────
alter publication supabase_realtime add table public.chat_lecturas;
