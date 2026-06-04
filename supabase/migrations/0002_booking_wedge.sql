-- ============================================================
-- 0002_booking_wedge.sql — Studio Booking Wedge MVP
-- "Calendly for fitness studios": classes, weekly schedules,
-- guest bookings, waitlists, check-in. No payments (free wedge).
-- New tables use uuid PKs; gym_id stays bigint to match gyms.id.
-- ============================================================

-- Public URL slug for each studio's booking page (/s/<slug>)
alter table public.gyms add column if not exists slug text unique;

-- New studios need auto-generated ids: 0001 loaded legacy ids explicitly with no
-- sequence on gyms.id. Attach one starting past the highest legacy id.
do $$
declare maxid bigint;
begin
  select coalesce(max(id),0) into maxid from public.gyms;
  if not exists (select 1 from pg_class where relname = 'gyms_id_seq') then
    create sequence public.gyms_id_seq owned by public.gyms.id;
  end if;
  perform setval('public.gyms_id_seq', greatest(maxid, 1));
  alter table public.gyms alter column id set default nextval('public.gyms_id_seq');
end $$;

-- ---------- Multi-studio membership: one user, many studios, role per studio ----------
create table if not exists public.user_studios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid   not null references auth.users(id) on delete cascade,
  gym_id      bigint not null references public.gyms(id) on delete cascade,
  role        text   not null default 'owner'
              check (role in ('owner','admin','instructor','staff')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, gym_id)
);
create index if not exists user_studios_user_idx on public.user_studios (user_id);
create index if not exists user_studios_gym_idx  on public.user_studios (gym_id);

-- ---------- Class types (the template) ----------
create table if not exists public.classes (
  id              uuid primary key default gen_random_uuid(),
  gym_id          bigint not null references public.gyms(id) on delete cascade,
  name            text not null,
  description     text,
  instructor_name text,
  capacity        integer not null check (capacity > 0),
  duration_min    integer not null default 60,
  color           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists classes_gym_idx on public.classes (gym_id);

-- ---------- Weekly recurrence rule ----------
create table if not exists public.class_schedules (
  id            uuid primary key default gen_random_uuid(),
  gym_id        bigint not null references public.gyms(id) on delete cascade,
  class_id      uuid   not null references public.classes(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),  -- 0=Sunday
  start_time    time not null,
  capacity      integer not null check (capacity > 0),
  active_from   date not null default current_date,
  active_until  date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists class_schedules_gym_idx   on public.class_schedules (gym_id);
create index if not exists class_schedules_class_idx on public.class_schedules (class_id);

-- ---------- Concrete dated sessions members book ----------
create table if not exists public.class_sessions (
  id            uuid primary key default gen_random_uuid(),
  gym_id        bigint not null references public.gyms(id) on delete cascade,
  class_id      uuid   not null references public.classes(id) on delete cascade,
  schedule_id   uuid   references public.class_schedules(id) on delete set null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  capacity      integer not null check (capacity > 0),
  booked_count  integer not null default 0,
  status        text not null default 'scheduled'
                check (status in ('scheduled','cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (schedule_id, starts_at)
);
create index if not exists class_sessions_gym_starts_idx on public.class_sessions (gym_id, starts_at);
create index if not exists class_sessions_class_idx      on public.class_sessions (class_id);

-- ---------- Bookings (guest: name + email, no account) ----------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  gym_id          bigint not null references public.gyms(id) on delete cascade,
  session_id      uuid   not null references public.class_sessions(id) on delete cascade,
  guest_name      text not null,
  guest_email     text not null,
  status          text not null default 'confirmed'
                  check (status in ('confirmed','waitlisted','cancelled','checked_in')),
  waitlist_position integer,
  cancel_token    uuid not null default gen_random_uuid(),
  booked_at       timestamptz not null default now(),
  cancelled_at    timestamptz,
  checked_in_at   timestamptz
);
create index if not exists bookings_session_idx on public.bookings (session_id);
create index if not exists bookings_gym_idx     on public.bookings (gym_id);
create unique index if not exists bookings_cancel_token_idx on public.bookings (cancel_token);
create unique index if not exists uniq_active_booking on public.bookings (session_id, lower(guest_email))
  where status in ('confirmed','waitlisted');

-- ============================================================
-- RLS: Studio A can never see Studio B's data.
-- Anonymous visitors get read-only safe views + one booking RPC.
-- ============================================================

create or replace function public.is_member_of_gym(p_gym_id bigint)
returns boolean language sql stable security definer
set search_path = public as $$
  select public.is_super_admin()
      or exists (select 1 from public.user_studios
                 where user_id = auth.uid() and gym_id = p_gym_id and is_active);
$$;

alter table public.user_studios    enable row level security;
alter table public.classes         enable row level security;
alter table public.class_schedules enable row level security;
alter table public.class_sessions  enable row level security;
alter table public.bookings        enable row level security;

create policy us_self on public.user_studios for all
  using (public.is_super_admin() or user_id = auth.uid());

create policy cls_scope on public.classes         for all using (public.is_member_of_gym(gym_id));
create policy sch_scope on public.class_schedules for all using (public.is_member_of_gym(gym_id));
create policy ses_scope on public.class_sessions  for all using (public.is_member_of_gym(gym_id));
create policy bk_scope  on public.bookings        for all using (public.is_member_of_gym(gym_id));

-- Let studio members (via user_studios) read/manage their own gym row.
-- (0001's gyms policy keyed on profiles.gym_id; the wedge uses user_studios.)
drop policy if exists gym_member_access on public.gyms;
create policy gym_member_access on public.gyms for all
  using (public.is_member_of_gym(id)) with check (public.is_member_of_gym(id));

-- ---------- Public (anonymous) read surface: safe columns only ----------
create or replace view public.studio_public
with (security_invoker = false) as
  select id, name, slug, brand_logo, city, timezone
  from public.gyms where is_active and deleted_at is null and slug is not null;

create or replace view public.public_sessions
with (security_invoker = false) as
  select s.id, s.gym_id, g.slug, c.name as class_name, c.description,
         c.instructor_name, c.duration_min, c.color,
         s.starts_at, s.ends_at, s.capacity,
         greatest(s.capacity - s.booked_count, 0) as spots_left
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  join public.gyms g on g.id = s.gym_id
  where s.status = 'scheduled' and s.starts_at > now();

grant select on public.studio_public, public.public_sessions to anon, authenticated;

-- ============================================================
-- Atomic booking (concurrency-safe). SECURITY DEFINER lets anon book
-- without direct table write. Row lock prevents double-booking the last seat.
-- ============================================================
create or replace function public.book_session(
  p_session_id uuid, p_name text, p_email text
) returns table (booking_id uuid, status text, waitlist_position int, cancel_token uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_cap int; v_count int; v_gym bigint; v_status text; v_pos int; v_id uuid; v_tok uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'NAME_REQUIRED'; end if;
  if p_email is null or position('@' in p_email) = 0 then raise exception 'EMAIL_REQUIRED'; end if;

  select capacity, booked_count, gym_id into v_cap, v_count, v_gym
  from public.class_sessions where id = p_session_id and status = 'scheduled'
  for update;
  if not found then raise exception 'SESSION_NOT_AVAILABLE'; end if;

  if exists (select 1 from public.bookings
             where session_id = p_session_id and lower(guest_email)=lower(p_email)
             and status in ('confirmed','waitlisted')) then
    raise exception 'ALREADY_BOOKED';
  end if;

  if v_count < v_cap then
    v_status := 'confirmed'; v_pos := null;
    update public.class_sessions set booked_count = booked_count + 1, updated_at = now()
      where id = p_session_id;
  else
    v_status := 'waitlisted';
    select coalesce(max(waitlist_position),0)+1 into v_pos from public.bookings
      where session_id = p_session_id and status = 'waitlisted';
  end if;

  insert into public.bookings (gym_id, session_id, guest_name, guest_email, status, waitlist_position)
    values (v_gym, p_session_id, trim(p_name), lower(trim(p_email)), v_status, v_pos)
    returning id, cancel_token into v_id, v_tok;

  return query select v_id, v_status, v_pos, v_tok;
end $$;

-- Cancel via guest token: free the seat, auto-promote first waitlisted.
create or replace function public.cancel_booking(p_cancel_token uuid)
returns table (promoted_email text, promoted_name text, gym_id bigint, session_id uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_session uuid; v_status text; v_gym bigint; v_promote uuid; v_email text; v_name text;
begin
  select b.session_id, b.status, b.gym_id into v_session, v_status, v_gym
  from public.bookings b where b.cancel_token = p_cancel_token for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if v_status = 'cancelled' then return; end if;

  update public.bookings set status='cancelled', cancelled_at=now() where cancel_token = p_cancel_token;

  if v_status in ('confirmed','checked_in') then
    perform 1 from public.class_sessions where id = v_session for update;
    select b.id, b.guest_email, b.guest_name into v_promote, v_email, v_name from public.bookings b
      where b.session_id = v_session and b.status='waitlisted'
      order by b.waitlist_position asc limit 1;
    if v_promote is not null then
      update public.bookings set status='confirmed', waitlist_position=null where id = v_promote;
      promoted_email := v_email; promoted_name := v_name; gym_id := v_gym; session_id := v_session;
      return next;
    else
      update public.class_sessions set booked_count = greatest(booked_count-1,0), updated_at=now()
        where id = v_session;
    end if;
  end if;
end $$;

grant execute on function public.book_session(uuid,text,text) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;

-- ============================================================
-- Create a studio atomically (gym + owner membership + unique slug).
-- SECURITY DEFINER resolves the chicken-and-egg: a new user can't pass the
-- gym RLS check until they own it, so this trusted function does both at once.
-- ============================================================
create or replace function public.create_studio(p_name text, p_timezone text)
returns table (gym_id bigint, slug text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_id bigint; v_slug text; v_base text; v_n int := 0;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'NAME_REQUIRED'; end if;

  v_base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then v_base := 'studio'; end if;
  v_slug := v_base;
  while exists (select 1 from public.gyms where slug = v_slug) loop
    v_n := v_n + 1; v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.gyms (name, timezone, slug, is_active, default_currency)
    values (trim(p_name), coalesce(nullif(trim(p_timezone), ''), 'UTC'), v_slug, true, 'GBP')
    returning id into v_id;
  insert into public.user_studios (user_id, gym_id, role)
    values (auth.uid(), v_id, 'owner');

  gym_id := v_id; slug := v_slug; return next;
end $$;
grant execute on function public.create_studio(text,text) to authenticated;

-- ============================================================
-- Session generation: dated sessions for a schedule across a horizon. Idempotent.
-- ============================================================
create or replace function public.generate_sessions(p_schedule_id uuid, p_weeks int default 8)
returns integer language plpgsql security definer set search_path = public as $$
declare r record; d date; ts timestamptz; n int := 0;
begin
  select cs.*, c.duration_min, g.timezone into r
  from public.class_schedules cs
  join public.classes c on c.id = cs.class_id
  join public.gyms g on g.id = cs.gym_id
  where cs.id = p_schedule_id and cs.is_active;
  if not found then return 0; end if;

  d := greatest(r.active_from, current_date);
  while d <= current_date + (p_weeks * 7) loop
    if extract(dow from d)::int = r.weekday
       and (r.active_until is null or d <= r.active_until) then
      ts := (d::text || ' ' || r.start_time::text)::timestamp at time zone coalesce(r.timezone,'UTC');
      insert into public.class_sessions (gym_id, class_id, schedule_id, starts_at, ends_at, capacity)
        values (r.gym_id, r.class_id, r.id, ts, ts + (r.duration_min || ' min')::interval, r.capacity)
      on conflict (schedule_id, starts_at) do nothing;
      n := n + 1;
    end if;
    d := d + 1;
  end loop;
  return n;
end $$;
