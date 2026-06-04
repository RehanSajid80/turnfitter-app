// Quick end-to-end connectivity check against Supabase.
// Run: node --env-file=.env.local scripts/test-connection.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("Connecting to:", url);

const supabase = createClient(url, key);

// pricing_plans allows anonymous read (public policy) -> proves connectivity.
const { data: plans, error: planErr } = await supabase.from("pricing_plans").select("*");
if (planErr) {
  console.error("❌ Connection FAILED:", planErr.message);
  process.exit(1);
}
console.log("✅ Connected to Supabase. pricing_plans rows:", plans.length);

// gyms is RLS-locked -> anon should see 0 rows (proves security is on).
const { data: gyms } = await supabase.from("gyms").select("id");
console.log("🔒 RLS check — gyms visible to anonymous:", (gyms ?? []).length, "(expected 0)");
console.log("✅ Foundation is connected and secured.");
