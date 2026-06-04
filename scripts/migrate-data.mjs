// TurnFitter legacy data migration: MySQL dump -> modern Supabase schema.
// Run: node --env-file=.env.local scripts/migrate-data.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_FILE = path.resolve(__dirname, "../../core-data-mysql.sql");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// ---------- MySQL VALUES parser ----------
function unescape(ch) {
  switch (ch) {
    case "n": return "\n";
    case "r": return "\r";
    case "t": return "\t";
    case "b": return "\b";
    case "0": return "";      // NUL -> drop (Postgres text can't hold it)
    case "Z": return "\x1a";
    default: return ch;        // \' \" \\ and anything else -> literal
  }
}

function parseRows(line) {
  // line: "INSERT INTO `t` VALUES (..),(..);"
  const s = line;
  let i = s.indexOf("VALUES ");
  if (i < 0) return [];
  i += "VALUES ".length;
  const n = s.length;
  const rows = [];
  while (i < n && s[i] !== "(") i++;
  while (i < n && s[i] === "(") {
    i++; // past '('
    const row = [];
    while (i < n) {
      let val;
      if (s[i] === "'") {
        i++;
        let str = "";
        while (i < n) {
          const c = s[i];
          if (c === "\\") { str += unescape(s[i + 1]); i += 2; }
          else if (c === "'") { i++; break; }
          else { str += c; i++; }
        }
        val = str;
      } else {
        const start = i;
        while (i < n && s[i] !== "," && s[i] !== ")") i++;
        const tok = s.slice(start, i).trim();
        val = tok === "NULL" ? null : tok;
      }
      row.push(val);
      if (s[i] === ",") { i++; continue; }
      if (s[i] === ")") { i++; break; }
    }
    rows.push(row);
    while (i < n && s[i] !== "(" && s[i] !== ";") i++;
    if (i >= n || s[i] === ";") break;
  }
  return rows;
}

const FILE = fs.readFileSync(SQL_FILE, "utf8");
const LINES = FILE.split("\n");
function rowsFor(table) {
  const line = LINES.find((l) => l.startsWith("INSERT INTO `" + table + "` "));
  return line ? parseRows(line) : [];
}

// ---------- helpers ----------
const yn = (v) => v === "Y" || v === "1";
const num = (v) => { if (v === null || v === "") return null; const x = Number(v); return Number.isFinite(x) ? x : null; };
const int = (v) => { if (v === null || v === "") return null; const x = parseInt(v, 10); return Number.isFinite(x) ? x : null; };
const date = (v) => { if (!v || v.startsWith("0000")) return null; return v.slice(0, 10); };
const ts = (v) => { if (!v || v.startsWith("0000")) return null; return v; };
const txt = (v) => (v === null ? null : v);

async function load(table, rows) {
  if (!rows.length) { console.log(`  ${table}: nothing to load`); return; }
  let ok = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: "id" });
    if (error) { console.error(`  ❌ ${table} [${i}-${i + chunk.length}]: ${error.message}`); return; }
    ok += chunk.length;
  }
  console.log(`  ✅ ${table}: ${ok} rows`);
}

// ===================================================================
console.log("Parsing legacy data...");
const rTfCompany   = rowsFor("tf_company");
const rLocations   = rowsFor("company_locations");
const rPricing     = rowsFor("pricing_plan");
const rMemTypes    = rowsFor("membership_type");
const rUsers       = rowsFor("users");
const rClients     = rowsFor("clients");
const rClientMems  = rowsFor("client_memberships");
const rStatus      = rowsFor("client_status");
const rSource      = rowsFor("client_source");
const rInterest    = rowsFor("client_interest");
const rInvoices    = rowsFor("invoices");
const rInvItems    = rowsFor("invoice_items");
const rPayments    = rowsFor("payments");

// id sets for FK validation
const gymIds = new Set(rTfCompany.map((r) => +r[0]));
const userToCompany = new Map(rUsers.map((r) => [+r[0], +r[5]])); // users.id -> companyID
const memTypeIds = new Set(rMemTypes.map((r) => +r[0]).filter((id) => true));
const gymOrNull = (id) => (id != null && gymIds.has(+id) ? +id : null);

// ---------- transforms ----------
const gyms = rTfCompany.map((r) => ({
  id: +r[0], name: txt(r[1]) || "Unnamed Gym", phone: txt(r[3]), website: txt(r[4]),
  address1: txt(r[14]), address2: txt(r[15]), city: txt(r[16]), postal_code: r[18] == null ? null : String(r[18]),
  country_id: int(r[17]), timezone: txt(r[19]), default_currency: txt(r[24]) || "GBP",
  brand_logo: txt(r[22]), stripe_account_id: txt(r[21]) || null, pricing_plan_id: int(r[5]),
  plan_valid_until: date(r[6]), is_active: yn(r[10]), created_at: ts(r[8]), updated_at: ts(r[9]),
  deleted_at: yn(r[11]) ? (ts(r[9]) || new Date(0).toISOString()) : null,
}));

const pricingPlans = rPricing.map((r) => ({
  id: +r[0], name: txt(r[1]) || "Plan", price: num(r[3]), currency: txt(r[13]) || "GBP",
  allowed_users: int(r[4]), interval: txt(r[20]) || "month", can_trial: yn(r[5]),
  trial_days: int(r[6]), stripe_plan_id: txt(r[19]), is_active: r[15] === "Y",
  created_at: ts(r[17]), updated_at: ts(r[18]), deleted_at: r[16] === "Y" ? new Date(0).toISOString() : null,
}));

const locations = rLocations.map((r) => ({
  id: +r[0], gym_id: gymOrNull(r[1]), name: txt(r[2]), address: txt(r[4]),
  postal_code: txt(r[8]), is_paid: yn(r[3]), created_at: ts(r[6]), updated_at: ts(r[7]),
  deleted_at: r[5] === "1" ? new Date(0).toISOString() : null,
})).filter((x) => x.gym_id !== null);

const lookups = (rows) => rows.map((r) => ({
  id: +r[0], gym_id: gymOrNull(r[1]), name: txt(r[2]), created_at: ts(r[3]),
})).filter((x) => x.gym_id !== null);

const memTypes = rMemTypes.map((r) => ({
  id: +r[0], gym_id: gymOrNull(r[1]), name: txt(r[2]), joining_fee: num(r[3]),
  monthly_fee: num(r[4]), length_months: int(r[5]), currency: txt(r[6]) || "GBP",
  stripe_plan_id: txt(r[8]) || null, is_active: r[10] === "1", created_at: ts(r[12]),
  updated_at: ts(r[13]), deleted_at: r[11] === "1" ? new Date(0).toISOString() : null,
})).filter((x) => x.gym_id !== null);
const memTypeIdSet = new Set(memTypes.map((m) => m.id));

const members = rClients.map((r) => {
  const gid = userToCompany.get(+r[1]);
  return {
    id: +r[0], gym_id: gid != null && gymIds.has(gid) ? gid : null, legacy_user_id: int(r[1]),
    full_name: txt(r[2]) || "Member", email: txt(r[3]), phone: txt(r[4]), gender: txt(r[5]),
    date_of_birth: date(r[8]), address: txt(r[7]), location: txt(r[9]),
    membership_type_id: memTypeIdSet.has(+r[21]) ? +r[21] : null,
    stripe_customer_id: txt(r[47]), next_payment_date: date(r[45]), package_expire_date: date(r[30]),
    points: num(r[46]) || 0, image_url: txt(r[42]), is_active: r[28] === "Y",
    created_at: ts(r[43]), updated_at: ts(r[44]), deleted_at: r[29] === "Y" ? new Date(0).toISOString() : null,
  };
}).filter((x) => x.gym_id !== null);
const memberIds = new Set(members.map((m) => m.id));

const memberMemberships = rClientMems.map((r) => ({
  id: +r[0], member_id: memberIds.has(+r[1]) ? +r[1] : null,
  membership_type_id: memTypeIdSet.has(+r[2]) ? +r[2] : null,
  status: txt(r[3]) || "unknown", valid_until: date(r[4]) || "1970-01-01",
  created_at: ts(r[5]), updated_at: ts(r[6]),
})).filter((x) => x.member_id !== null);

const invoices = rInvoices.map((r) => ({
  id: +r[0], member_id: memberIds.has(+r[6]) ? +r[6] : null, invoice_number: txt(r[2]),
  title: txt(r[1]), description: txt(r[4]), amount_paid: num(r[5]),
  is_sent: r[14] === "Y", is_paid: r[15] === "Y", date_paid: ts(r[8]), expiry: ts(r[9]),
  created_at: ts(r[12]), updated_at: ts(r[13]),
}));
const invoiceIds = new Set(invoices.map((i) => i.id));

const invoiceItems = rInvItems.map((r) => ({
  id: +r[0], invoice_id: invoiceIds.has(+r[1]) ? +r[1] : null, name: txt(r[2]),
  description: txt(r[9]), unit_cost: num(r[3]), quantity: int(r[4]), discount: num(r[7]),
  total: num(r[8]), created_at: ts(r[12]),
})).filter((x) => x.invoice_id !== null);

const payments = rPayments.map((r) => ({
  id: +r[0], member_id: memberIds.has(+r[1]) ? +r[1] : null, membership_id: int(r[2]),
  invoice_number: txt(r[3]), first_month_amount: num(r[4]), monthly_amount: num(r[5]),
  payment_date: ts(r[6]), stripe_customer_id: txt(r[7]) || null, stripe_charge_id: txt(r[8]) || null,
  payment_status: txt(r[16]), is_active: r[19] === "1", created_at: ts(r[21]), updated_at: ts(r[22]),
}));

// ---------- load in dependency order ----------
console.log("\nLoading into Supabase...");
await load("pricing_plans", pricingPlans);
await load("gyms", gyms);
await load("gym_locations", locations);
await load("member_statuses", lookups(rStatus));
await load("member_sources", lookups(rSource));
await load("member_interests", lookups(rInterest));
await load("membership_types", memTypes);
await load("members", members);
await load("member_memberships", memberMemberships);
await load("invoices", invoices);
await load("invoice_items", invoiceItems);
await load("payments", payments);
console.log("\n🎉 Migration complete.");
