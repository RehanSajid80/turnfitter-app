-- ============================================================
-- 0004_gym_branding.sql — let each studio brand their public page
-- (logo, hero, headline, editable CTA, accent colour).
-- ============================================================

alter table public.gyms add column if not exists hero_headline text;
alter table public.gyms add column if not exists hero_subtitle text;
alter table public.gyms add column if not exists hero_image_url text;
alter table public.gyms add column if not exists cta_label text;
alter table public.gyms add column if not exists cta_url text;
alter table public.gyms add column if not exists accent_color text;

-- Expose the branding fields on the public (anonymous) view.
-- create-or-replace keeps the existing anon/authenticated grants; new columns
-- are appended after the existing ones.
create or replace view public.studio_public
with (security_invoker = false) as
  select id, name, slug, brand_logo, city, timezone,
         hero_headline, hero_subtitle, hero_image_url, cta_label, cta_url, accent_color
  from public.gyms
  where is_active and deleted_at is null and slug is not null;
