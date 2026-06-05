-- ============================================================
-- 0006_reschedule.sql — move a session to a new day/time (drag-drop calendar)
-- Recomputes starts_at/ends_at in the gym's timezone. Gated to studio members.
-- ============================================================
create or replace function public.reschedule_session(
  p_session_id uuid, p_date date, p_time time
) returns void
language plpgsql security definer set search_path = public as $$
declare r record; ts timestamptz;
begin
  select s.gym_id as gym_id, c.duration_min as duration_min, g.timezone as timezone
  into r
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  join public.gyms g on g.id = s.gym_id
  where s.id = p_session_id;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not public.is_member_of_gym(r.gym_id) then raise exception 'NOT_ALLOWED'; end if;

  ts := (p_date::text || ' ' || p_time::text)::timestamp
        at time zone coalesce(r.timezone, 'UTC');
  update public.class_sessions
    set starts_at = ts,
        ends_at = ts + (r.duration_min || ' min')::interval,
        updated_at = now()
    where id = p_session_id;
end $$;
grant execute on function public.reschedule_session(uuid, date, time) to authenticated;
