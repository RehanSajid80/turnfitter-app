-- =====================================================================
-- TurnFitter — Modern Core Schema (Phase 1)
-- Target: Supabase / PostgreSQL
-- Source: legacy MySQL `turnfitter` DB (2026-06-02 rescue)
--
-- Design principles vs the legacy schema:
--   * Real FOREIGN KEYS (legacy had almost none)
--   * Proper booleans + timestamptz (legacy used 'Y'/'N' text & 0000-00-00)
--   * Normalized member status/source/interest (legacy duplicated as text)
--   * Multi-tenant via gym_id + Row-Level Security (each gym sees only its data)
--   * Legacy integer IDs preserved so existing data maps 1:1 on import
-- =====================================================================

-- ---------- Tenants: gyms (was `tf_company`) ----------
create table public.gyms (
  id                 bigint primary key,            -- preserves legacy tf_company.id
  name               text not null,
  phone              text,
  website            text,
  address1           text,
  address2           text,
  city               text,
  postal_code        text,
  country_id         bigint,
  timezone           text,
  default_currency   text default 'GBP',
  brand_logo         text,
  stripe_account_id  text,                          -- gym's connected Stripe account
  pricing_plan_id    bigint,                         -- which SaaS plan the gym is on
  plan_valid_until   date,
  is_active          boolean not null default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  deleted_at         timestamptz                     -- soft delete (was isDeleted='Y')
);

-- ---------- Gym locations (was `company_locations`) ----------
create table public.gym_locations (
  id           bigint primary key,
  gym_id       bigint not null references public.gyms(id) on delete cascade,
  name         text,
  address      text,
  postal_code  text,
  is_paid      boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  deleted_at   timestamptz
);

-- ---------- SaaS pricing plans (was `pricing_plan`) ----------
create table public.pricing_plans (
  id               bigint primary key,
  name             text not null,
  price            numeric(10,2),
  currency         text default 'GBP',
  allowed_users    integer,
  interval         text default 'month',
  can_trial        boolean default false,
  trial_days       integer,
  stripe_plan_id   text,
  is_active        boolean not null default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  deleted_at       timestamptz
);

-- ---------- App users / staff logins (was `users` + `staff`) ----------
-- Linked to Supabase Auth. Gym admins & staff who log in.
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  gym_id          bigint references public.gyms(id) on delete set null,
  legacy_user_id  bigint,                            -- maps to old users.id
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  role            text not null default 'staff',     -- 'super_admin' | 'gym_admin' | 'staff'
  is_active       boolean not null default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------- Per-gym lookups (were duplicated as text on clients) ----------
create table public.member_statuses (
  id bigint primary key, gym_id bigint references public.gyms(id) on delete cascade,
  name text, created_at timestamptz default now()
);
create table public.member_sources (
  id bigint primary key, gym_id bigint references public.gyms(id) on delete cascade,
  name text, created_at timestamptz default now()
);
create table public.member_interests (
  id bigint primary key, gym_id bigint references public.gyms(id) on delete cascade,
  name text, created_at timestamptz default now()
);

-- ---------- Membership types (was `membership_type`) ----------
create table public.membership_types (
  id                    bigint primary key,
  gym_id                bigint references public.gyms(id) on delete cascade,
  name                  text,
  joining_fee           numeric(10,2),
  monthly_fee           numeric(10,2),
  length_months         integer,
  currency              text default 'GBP',
  stripe_plan_id        text,
  is_active             boolean not null default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  deleted_at            timestamptz
);

-- ---------- Members (was `clients`) — normalized ----------
create table public.members (
  id                     bigint primary key,
  gym_id                 bigint references public.gyms(id) on delete cascade,
  legacy_user_id         bigint,
  full_name              text not null,
  email                  text,
  phone                  text,
  gender                 text,
  date_of_birth          date,
  address                text,
  location               text,
  status_id              bigint references public.member_statuses(id),
  source_id              bigint references public.member_sources(id),
  interest_id            bigint references public.member_interests(id),
  membership_type_id     bigint references public.membership_types(id),
  stripe_customer_id     text,
  next_payment_date      date,
  package_expire_date    date,
  points                 numeric(10,2) not null default 0,
  image_url              text,
  is_active              boolean not null default true,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  deleted_at             timestamptz
);

-- ---------- Member <-> membership assignments (was `client_memberships`) ----------
create table public.member_memberships (
  id                  bigint primary key,
  member_id           bigint not null references public.members(id) on delete cascade,
  membership_type_id  bigint references public.membership_types(id),
  status              text not null,
  valid_until         date not null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ---------- Invoices (was `invoices`) ----------
create table public.invoices (
  id              bigint primary key,
  member_id       bigint references public.members(id) on delete set null,
  invoice_number  text,
  title           text,
  description     text,
  amount_paid     numeric(10,2),
  is_sent         boolean not null default false,
  is_paid         boolean not null default false,
  date_paid       timestamptz,
  expiry          timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------- Invoice line items (was `invoice_items`) ----------
create table public.invoice_items (
  id          bigint primary key,
  invoice_id  bigint references public.invoices(id) on delete cascade,
  name        text,
  description text,
  unit_cost   numeric(10,2),
  quantity    integer,
  discount    numeric(10,2),
  total       numeric(10,2),
  created_at  timestamptz default now()
);

-- ---------- Payments (was `payments`) ----------
create table public.payments (
  id                  bigint primary key,
  member_id           bigint references public.members(id) on delete set null,
  membership_id       bigint,
  invoice_number      text,
  first_month_amount  numeric(10,2),
  monthly_amount      numeric(10,2),
  payment_date        timestamptz default now(),
  stripe_customer_id  text,
  stripe_charge_id    text,
  payment_status      text,
  is_active           boolean not null default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- =====================================================================
-- Helpful indexes
-- =====================================================================
create index on public.members(gym_id);
create index on public.members(status_id);
create index on public.invoices(member_id);
create index on public.payments(member_id);
create index on public.profiles(gym_id);
create index on public.membership_types(gym_id);

-- =====================================================================
-- Row-Level Security: each gym only sees its own data.
-- A logged-in user's gym is taken from their profile row.
-- =====================================================================
create or replace function public.current_gym_id()
returns bigint language sql stable security definer as $$
  select gym_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false)
$$;

-- Enable RLS on every tenant table
alter table public.gyms                enable row level security;
alter table public.gym_locations       enable row level security;
alter table public.profiles            enable row level security;
alter table public.member_statuses     enable row level security;
alter table public.member_sources      enable row level security;
alter table public.member_interests    enable row level security;
alter table public.membership_types    enable row level security;
alter table public.members             enable row level security;
alter table public.member_memberships  enable row level security;
alter table public.invoices            enable row level security;
alter table public.invoice_items       enable row level security;
alter table public.payments            enable row level security;

-- Gyms: a user sees their own gym (super admins see all)
create policy gym_isolation on public.gyms
  for all using (public.is_super_admin() or id = public.current_gym_id());

-- Profiles: you can read your own profile and peers in your gym
create policy profile_self on public.profiles
  for all using (public.is_super_admin() or id = auth.uid() or gym_id = public.current_gym_id());

-- Generic gym-scoped policy for the rest
create policy gym_scope on public.gym_locations      for all using (public.is_super_admin() or gym_id = public.current_gym_id());
create policy gym_scope on public.member_statuses    for all using (public.is_super_admin() or gym_id = public.current_gym_id());
create policy gym_scope on public.member_sources     for all using (public.is_super_admin() or gym_id = public.current_gym_id());
create policy gym_scope on public.member_interests   for all using (public.is_super_admin() or gym_id = public.current_gym_id());
create policy gym_scope on public.membership_types   for all using (public.is_super_admin() or gym_id = public.current_gym_id());
create policy gym_scope on public.members            for all using (public.is_super_admin() or gym_id = public.current_gym_id());

-- Child tables scope through their parent
create policy via_member on public.member_memberships for all using (
  public.is_super_admin() or exists (select 1 from public.members m where m.id = member_id and m.gym_id = public.current_gym_id()));
create policy via_member on public.invoices for all using (
  public.is_super_admin() or member_id is null or exists (select 1 from public.members m where m.id = member_id and m.gym_id = public.current_gym_id()));
create policy via_invoice on public.invoice_items for all using (
  public.is_super_admin() or exists (select 1 from public.invoices i join public.members m on m.id = i.member_id where i.id = invoice_id and m.gym_id = public.current_gym_id()));
create policy via_member on public.payments for all using (
  public.is_super_admin() or member_id is null or exists (select 1 from public.members m where m.id = member_id and m.gym_id = public.current_gym_id()));

-- pricing_plans are global/readable; lock writes to super admins
alter table public.pricing_plans enable row level security;
create policy plans_read on public.pricing_plans for select using (true);
create policy plans_write on public.pricing_plans for all using (public.is_super_admin());
