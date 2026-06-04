// Spot-check migrated data. Run: node --env-file=.env.local scripts/verify-data.mjs
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { count: gymCount } = await supabase.from("gyms").select("*", { count: "exact", head: true });
const { count: memberCount } = await supabase.from("members").select("*", { count: "exact", head: true });
console.log(`Totals -> gyms: ${gymCount}, members: ${memberCount}\n`);

// Sample real members joined to their gym
const { data: sample } = await supabase
  .from("members")
  .select("id, full_name, email, gym_id, gyms(name)")
  .not("email", "is", null)
  .limit(5);
console.log("Sample members (with their gym):");
for (const m of sample ?? []) console.log(`  #${m.id}  ${m.full_name}  <${m.email}>  @ ${m.gyms?.name ?? "—"}`);

// A real invoice with money
const { data: inv } = await supabase.from("invoices").select("invoice_number, amount_paid, is_paid").gt("amount_paid", 0).limit(3);
console.log("\nSample paid invoices:");
for (const i of inv ?? []) console.log(`  ${i.invoice_number}  £${i.amount_paid}  paid=${i.is_paid}`);
