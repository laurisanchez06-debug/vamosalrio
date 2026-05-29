-- =============================================================================
-- vamosalrio — migración inicial
-- Tablas: profiles, salidas, participaciones, calificaciones, reportes
-- + RLS en todas, + trigger de auto-creación de profile al signup.
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ──────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  nombre                text,
  foto_url              text,
  bio                   text,
  fecha_nacimiento      date,                              -- para calcular edad; nunca exponer cruda
  zona_texto            text,                              -- "Pichincha", "Fisherton" — NUNCA dirección exacta
  instagram_handle      text,
  verificado            boolean   not null default false,  -- verificación ligera (OAuth real = V2)
  reputacion_promedio   numeric   not null default 0,
  salidas_creadas       int       not null default 0,
  salidas_asistidas     int       not null default 0,
  created_at            timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. SALIDAS
-- ──────────────────────────────────────────────────────────────────────────────
create table public.salidas (
  id                          uuid primary key default gen_random_uuid(),
  host_id                     uuid not null references public.profiles(id) on delete cascade,
  titulo                      text not null,
  descripcion                 text,
  tipo                        text not null default 'rio'
                                check (tipo in ('rio')),     -- el CHECK se amplía a futuro
  punto_encuentro_texto       text,
  punto_encuentro_lat         numeric,
  punto_encuentro_lng         numeric,
  fecha_hora                  timestamptz not null,
  cupos_total                 int  not null,
  cupos_ocupados              int  not null default 0,
  transporte                  text
                                check (transporte in (
                                  'lancha_publica','lancha_privada','lancha_taxi',
                                  'kayak','a_pie','otro'
                                )),
  costos                      jsonb not null default '{}'::jsonb,
  que_llevar                  text,
  estado                      text not null default 'abierta'
                                check (estado in (
                                  'abierta','completa','cerrada','finalizada','cancelada'
                                )),
  created_at                  timestamptz not null default now()
);

create index salidas_host_id_idx     on public.salidas (host_id);
create index salidas_fecha_hora_idx  on public.salidas (fecha_hora);
create index salidas_estado_idx      on public.salidas (estado);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. PARTICIPACIONES
-- ──────────────────────────────────────────────────────────────────────────────
create table public.participaciones (
  id          uuid primary key default gen_random_uuid(),
  salida_id   uuid not null references public.salidas(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  estado      text not null default 'pendiente'
                check (estado in ('pendiente','aceptado','rechazado')),
  created_at  timestamptz not null default now(),
  unique (salida_id, user_id)
);

create index participaciones_salida_id_idx on public.participaciones (salida_id);
create index participaciones_user_id_idx   on public.participaciones (user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. CALIFICACIONES
-- ──────────────────────────────────────────────────────────────────────────────
create table public.calificaciones (
  id              uuid primary key default gen_random_uuid(),
  salida_id       uuid not null references public.salidas(id) on delete cascade,
  from_user       uuid not null references public.profiles(id) on delete cascade,
  to_user         uuid not null references public.profiles(id) on delete cascade,
  rol_calificado  text not null check (rol_calificado in ('host','invitado')),
  puntaje         int  not null check (puntaje between 1 and 5),
  comentario      text,
  created_at      timestamptz not null default now(),
  unique (salida_id, from_user, to_user)
);

create index calificaciones_salida_id_idx on public.calificaciones (salida_id);
create index calificaciones_to_user_idx   on public.calificaciones (to_user);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. REPORTES (baseline de seguridad)
-- ──────────────────────────────────────────────────────────────────────────────
create table public.reportes (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid not null references public.profiles(id) on delete cascade,
  reportado   uuid not null references public.profiles(id) on delete cascade,
  salida_id   uuid     references public.salidas(id)  on delete set null,
  motivo      text not null,
  created_at  timestamptz not null default now()
);

create index reportes_reporter_idx  on public.reportes (reporter);
create index reportes_reportado_idx on public.reportes (reportado);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.salidas          enable row level security;
alter table public.participaciones  enable row level security;
alter table public.calificaciones   enable row level security;
alter table public.reportes         enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());

-- ── salidas ──────────────────────────────────────────────────────────────────
create policy "salidas_select_authenticated"
  on public.salidas for select
  to authenticated
  using (true);

create policy "salidas_insert_host"
  on public.salidas for insert
  to authenticated
  with check (host_id = auth.uid());

create policy "salidas_update_host"
  on public.salidas for update
  to authenticated
  using  (host_id = auth.uid())
  with check (host_id = auth.uid());

-- ── participaciones ──────────────────────────────────────────────────────────
-- SELECT: la veo si soy el participante o si soy host de la salida.
create policy "participaciones_select_self_or_host"
  on public.participaciones for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.salidas s
      where s.id = participaciones.salida_id
        and s.host_id = auth.uid()
    )
  );

-- INSERT: el autenticado se anota a sí mismo.
create policy "participaciones_insert_self"
  on public.participaciones for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: solo el host de la salida puede cambiar el estado (aceptar/rechazar).
create policy "participaciones_update_host"
  on public.participaciones for update
  to authenticated
  using (
    exists (
      select 1 from public.salidas s
      where s.id = participaciones.salida_id
        and s.host_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salidas s
      where s.id = participaciones.salida_id
        and s.host_id = auth.uid()
    )
  );

-- ── calificaciones ───────────────────────────────────────────────────────────
create policy "calificaciones_select_authenticated"
  on public.calificaciones for select
  to authenticated
  using (true);

-- INSERT: solo si participaste de la salida (como host o como invitado aceptado).
create policy "calificaciones_insert_participante"
  on public.calificaciones for insert
  to authenticated
  with check (
    from_user = auth.uid()
    and (
      exists (
        select 1 from public.salidas s
        where s.id = calificaciones.salida_id
          and s.host_id = auth.uid()
      )
      or exists (
        select 1 from public.participaciones p
        where p.salida_id = calificaciones.salida_id
          and p.user_id  = auth.uid()
          and p.estado   = 'aceptado'
      )
    )
  );

-- ── reportes ─────────────────────────────────────────────────────────────────
create policy "reportes_insert_self"
  on public.reportes for insert
  to authenticated
  with check (reporter = auth.uid());

create policy "reportes_select_own"
  on public.reportes for select
  to authenticated
  using (reporter = auth.uid());

-- =============================================================================
-- TRIGGER: al hacer signup en auth.users, crear el profile automáticamente.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
