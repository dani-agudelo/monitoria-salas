alter table public.presences
  add column if not exists leaves_at timestamptz;

alter table public.presences
  drop constraint if exists presences_leaves_at_check;

alter table public.presences
  add constraint presences_leaves_at_check
  check (leaves_at is null or leaves_at >= started_at);

alter table public.presences
  drop constraint if exists presences_monitor_id_fkey;

alter table public.presences
  add constraint presences_monitor_id_fkey
  foreign key (monitor_id) references public.profiles (id) on delete cascade;

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
grant select on public.open_rooms to anon, authenticated;
