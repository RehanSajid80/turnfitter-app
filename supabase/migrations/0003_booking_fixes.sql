-- ============================================================
-- 0003_booking_fixes.sql — fix ambiguous column/variable references
-- in the booking functions (Postgres raised "column reference is
-- ambiguous" where an OUT field name matched a table column).
-- `#variable_conflict use_column` makes bare names resolve to columns.
-- All create-or-replace, so safe to run on the live DB.
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
  while exists (select 1 from public.gyms g where g.slug = v_slug) loop
    v_n := v_n + 1; v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.gyms (name, timezone, slug, is_active, default_currency)
    values (trim(p_name), coalesce(nullif(trim(p_timezone), ''), 'UTC'), v_slug, true, 'GBP')
    returning id into v_id;
  insert into public.user_studios (user_id, gym_id, role)
    values (auth.uid(), v_id, 'owner');

  gym_id := v_id; slug := v_slug; return next;
end $$;

create or replace function public.book_session(
  p_session_id uuid, p_name text, p_email text
) returns table (booking_id uuid, status text, waitlist_position int, cancel_token uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_cap int; v_count int; v_gym bigint; v_status text; v_pos int; v_id uuid; v_tok uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then raise exception 'NAME_REQUIRED'; end if;
  if p_email is null or position('@' in p_email) = 0 then raise exception 'EMAIL_REQUIRED'; end if;

  select s.capacity, s.booked_count, s.gym_id into v_cap, v_count, v_gym
  from public.class_sessions s where s.id = p_session_id and s.status = 'scheduled'
  for update;
  if not found then raise exception 'SESSION_NOT_AVAILABLE'; end if;

  if exists (select 1 from public.bookings b
             where b.session_id = p_session_id and lower(b.guest_email)=lower(p_email)
             and b.status in ('confirmed','waitlisted')) then
    raise exception 'ALREADY_BOOKED';
  end if;

  if v_count < v_cap then
    v_status := 'confirmed'; v_pos := null;
    update public.class_sessions set booked_count = booked_count + 1, updated_at = now()
      where id = p_session_id;
  else
    v_status := 'waitlisted';
    select coalesce(max(b.waitlist_position),0)+1 into v_pos from public.bookings b
      where b.session_id = p_session_id and b.status = 'waitlisted';
  end if;

  insert into public.bookings (gym_id, session_id, guest_name, guest_email, status, waitlist_position)
    values (v_gym, p_session_id, trim(p_name), lower(trim(p_email)), v_status, v_pos)
    returning id, cancel_token into v_id, v_tok;

  return query select v_id, v_status, v_pos, v_tok;
end $$;

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

grant execute on function public.create_studio(text,text) to authenticated;
grant execute on function public.book_session(uuid,text,text) to anon, authenticated;
grant execute on function public.cancel_booking(uuid) to anon, authenticated;
