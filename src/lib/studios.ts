import { createClient } from "@/lib/supabase/server";

export type Studio = {
  id: number;
  name: string;
  slug: string | null;
  timezone: string | null;
  role: string;
};

type LinkRow = { gym_id: number; role: string };
type GymRow = {
  id: number;
  name: string;
  slug: string | null;
  timezone: string | null;
};

// All studios the logged-in user belongs to (RLS limits this to their own).
export async function getUserStudios(): Promise<Studio[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("user_studios")
    .select("gym_id, role")
    .eq("is_active", true);

  const linkRows = (links as LinkRow[] | null) ?? [];
  if (linkRows.length === 0) return [];

  const ids = linkRows.map((l) => l.gym_id);
  const roleById = new Map(linkRows.map((l) => [l.gym_id, l.role]));

  const { data: gyms } = await supabase
    .from("gyms")
    .select("id, name, slug, timezone")
    .in("id", ids);

  return ((gyms as GymRow[] | null) ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    timezone: g.timezone,
    role: roleById.get(g.id) ?? "owner",
  }));
}

// MVP single-studio UX: the user's first (and usually only) studio.
export async function getCurrentStudio(): Promise<Studio | null> {
  const studios = await getUserStudios();
  return studios[0] ?? null;
}

// Turn a studio name into a URL-safe slug. Uniqueness handled by the caller.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "studio";
}
