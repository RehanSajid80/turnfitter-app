-- ============================================================
-- 0005_class_extras.sql — price + one-off (non-recurring) classes
-- (instructor_name already exists on classes from 0002)
-- ============================================================

alter table public.classes add column if not exists price numeric(10,2);

-- Surface price on the public booking view (appended column).
create or replace view public.public_sessions
with (security_invoker = false) as
  select s.id, s.gym_id, g.slug, c.name as class_name, c.description,
         c.instructor_name, c.duration_min, c.color,
         s.starts_at, s.ends_at, s.capacity,
         greatest(s.capacity - s.booked_count, 0) as spots_left,
         c.price
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  join public.gyms g on g.id = s.gym_id
  where s.status = 'scheduled' and s.starts_at > now();

-- Create a single dated session (non-recurring class) in the gym's timezone.
-- SECURITY DEFINER but gated to studio members.
create or replace function public.create_one_off_session(
  p_class_id uuid, p_date date, p_time time
) returns uuid
language plpgsql security definer set search_path = public as $$
declare r record; ts timestamptz; v_id uuid;
begin
  select c.gym_id as gym_id, c.capacity as capacity, c.duration_min as duration_min,
         g.timezone as timezone
  into r
  from public.classes c join public.gyms g on g.id = c.gym_id
  where c.id = p_class_id;
  if not found then raise exception 'CLASS_NOT_FOUND'; end if;
  if not public.is_member_of_gym(r.gym_id) then raise exception 'NOT_ALLOWED'; end if;

  ts := (p_date::text || ' ' || p_time::text)::timestamp
        at time zone coalesce(r.timezone, 'UTC');
  insert into public.class_sessions (gym_id, class_id, starts_at, ends_at, capacity)
    values (r.gym_id, p_class_id, ts, ts + (r.duration_min || ' min')::interval, r.capacity)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.create_one_off_session(uuid, date, time) to authenticated;
