-- ============================================================
-- 0007_staff.sql — per-studio staff / instructors list
-- ============================================================
create table if not exists public.gym_staff (
  id          uuid primary key default gen_random_uuid(),
  gym_id      bigint not null references public.gyms(id) on delete cascade,
  name        text not null,
  email       text,
  role        text not null default 'instructor'
              check (role in ('instructor', 'staff', 'admin')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists gym_staff_gym_idx on public.gym_staff (gym_id);

alter table public.gym_staff enable row level security;
create policy gym_staff_scope on public.gym_staff for all
  using (public.is_member_of_gym(gym_id))
  with check (public.is_member_of_gym(gym_id));
