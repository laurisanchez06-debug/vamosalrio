-- =============================================================================
-- vamosalrio — 0007: aportes (lista colaborativa de "quién lleva qué")
-- Tabla aportes + RLS (SELECT público, INSERT/DELETE host, UPDATE host o aceptado).
-- =============================================================================

create table public.aportes (
  id          uuid primary key default gen_random_uuid(),
  salida_id   uuid not null references public.salidas(id)  on delete cascade,
  nombre      text not null,
  categoria   text not null check (categoria in ('host', 'repartir', 'cada_uno')),
  asignado_a  uuid references public.profiles(id) on delete set null,  -- null = sin reclamar
  created_at  timestamptz not null default now()
);

create index aportes_salida_id_idx on public.aportes (salida_id);

alter table public.aportes enable row level security;

-- ── SELECT: público (la lista se ve en el detalle, también para anónimos) ──────
create policy "aportes_select_todos"
  on public.aportes for select
  to anon, authenticated
  using (true);

-- ── INSERT: solo el host de la salida ─────────────────────────────────────────
create policy "aportes_insert_host"
  on public.aportes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.salidas s
      where s.id = aportes.salida_id
        and s.host_id = auth.uid()
    )
  );

-- ── UPDATE: el host O un participante aceptado (reclamar / soltar) ─────────────
create policy "aportes_update_host_o_aceptado"
  on public.aportes for update
  to authenticated
  using (
    exists (
      select 1 from public.salidas s
      where s.id = aportes.salida_id
        and s.host_id = auth.uid()
    )
    or exists (
      select 1 from public.participaciones p
      where p.salida_id = aportes.salida_id
        and p.user_id  = auth.uid()
        and p.estado   = 'aceptado'
    )
  )
  with check (
    exists (
      select 1 from public.salidas s
      where s.id = aportes.salida_id
        and s.host_id = auth.uid()
    )
    or exists (
      select 1 from public.participaciones p
      where p.salida_id = aportes.salida_id
        and p.user_id  = auth.uid()
        and p.estado   = 'aceptado'
    )
  );

-- ── DELETE: solo el host ──────────────────────────────────────────────────────
create policy "aportes_delete_host"
  on public.aportes for delete
  to authenticated
  using (
    exists (
      select 1 from public.salidas s
      where s.id = aportes.salida_id
        and s.host_id = auth.uid()
    )
  );
