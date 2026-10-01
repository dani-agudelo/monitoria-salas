-- Monitoría de Salas
-- Una sala abierta tiene 1 o 2 monitores. Un monitor solo puede estar en una sala.

create type public.user_role as enum ('coordinator', 'monitor');

create table public.locations (
  id text primary key,
  name text not null
);

create table public.rooms (
  id text primary key,
  location_id text not null references public.locations (id),
  name text not null,
  capacity integer not null check (capacity > 0),
  features text[] not null default '{}'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null
);

create table public.presences (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms (id),
  monitor_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  leaves_at timestamptz,
  ended_at timestamptz,
  check (ended_at is null or ended_at >= started_at),
  check (leaves_at is null or leaves_at >= started_at)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  presence_id uuid not null references public.presences (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index presences_open_room_idx on public.presences (room_id) where ended_at is null;
create index presences_open_monitor_idx on public.presences (monitor_id) where ended_at is null;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.enforce_presence_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  open_in_room integer;
  open_for_monitor integer;
begin
  if new.ended_at is not null then
    return new;
  end if;

  select count(*) into open_in_room
  from public.presences
  where room_id = new.room_id
    and ended_at is null
    and id is distinct from new.id;

  if open_in_room >= 2 then
    raise exception 'Una sala admite como máximo 2 monitores';
  end if;

  select count(*) into open_for_monitor
  from public.presences
  where monitor_id = new.monitor_id
    and ended_at is null
    and id is distinct from new.id;

  if open_for_monitor >= 1 then
    raise exception 'El monitor ya está asignado a una sala';
  end if;

  return new;
end;
$$;

create trigger presences_enforce_rules
before insert or update on public.presences
for each row execute function public.enforce_presence_rules();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text;
  next_role public.user_role;
begin
  requested := new.raw_user_meta_data->>'role';
  if requested = 'coordinator' then
    next_role := 'coordinator';
  else
    next_role := 'monitor';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'monitor'), '@', 1)),
    next_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.limit_coordinators()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  coordinators integer;
begin
  if new.role <> 'coordinator' then
    return new;
  end if;

  select count(*) into coordinators
  from public.profiles
  where role = 'coordinator'
    and id is distinct from new.id;

  if coordinators >= 2 then
    raise exception 'Solo puede haber dos coordinadores';
  end if;

  return new;
end;
$$;

create trigger profiles_limit_coordinators
before insert or update on public.profiles
for each row execute function public.limit_coordinators();

create or replace view public.open_rooms as
select
  r.id as room_id,
  r.name as room_name,
  r.capacity,
  r.features,
  l.id as location_id,
  l.name as location_name,
  p.id as presence_id,
  p.started_at,
  pr.id as monitor_id,
  pr.full_name as monitor_name,
  p.leaves_at
from public.presences p
join public.rooms r on r.id = p.room_id
join public.locations l on l.id = r.location_id
join public.profiles pr on pr.id = p.monitor_id
where p.ended_at is null;

alter view public.open_rooms set (security_invoker = false);

insert into public.locations (id, name) values
  ('central', 'Sede Central'),
  ('lans', 'Sede Lans');

insert into public.rooms (id, location_id, name, capacity, features) values
  ('c201', 'central', 'Sala C-201', 32, array['32 equipos', 'Aire acondicionado']),
  ('c305', 'central', 'Sala C-305', 24, array['24 equipos', 'Software de diseño']),
  ('l102', 'lans', 'Sala L-102', 28, array['28 equipos', 'Zona silenciosa']),
  ('l204', 'lans', 'Sala L-204', 20, array['20 equipos', 'Acceso universal']);

alter table public.locations enable row level security;
alter table public.rooms enable row level security;
alter table public.profiles enable row level security;
alter table public.presences enable row level security;
alter table public.observations enable row level security;

create policy "rooms are visible to everyone"
on public.rooms for select
to anon, authenticated
using (true);

create policy "locations are visible to everyone"
on public.locations for select
to anon, authenticated
using (true);

create policy "read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_role() = 'coordinator');

create policy "coordinators read presences"
on public.presences for select
to authenticated
using (public.current_role() = 'coordinator' or monitor_id = auth.uid());

create policy "coordinators assign monitors"
on public.presences for insert
to authenticated
with check (public.current_role() = 'coordinator');

create policy "close own presence or any as coordinator"
on public.presences for update
to authenticated
using (public.current_role() = 'coordinator' or monitor_id = auth.uid())
with check (public.current_role() = 'coordinator' or monitor_id = auth.uid());

create policy "read related observations"
on public.observations for select
to authenticated
using (
  public.current_role() = 'coordinator'
  or exists (
    select 1 from public.presences
    where presences.id = observations.presence_id
      and presences.monitor_id = auth.uid()
  )
);

create policy "monitors write their observation"
on public.observations for insert
to authenticated
with check (
  exists (
    select 1 from public.presences
    where presences.id = observations.presence_id
      and presences.monitor_id = auth.uid()
      and presences.ended_at is null
  )
);

grant select on public.open_rooms to anon, authenticated;
grant select on public.rooms, public.locations to anon, authenticated;
grant select, insert, update on public.presences to authenticated;
grant select, insert on public.observations to authenticated;
grant select on public.profiles to authenticated;
