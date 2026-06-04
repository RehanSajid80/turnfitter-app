// End-to-end verification of the booking wedge against the live Supabase DB.
// Run: node --env-file=.env.local scripts/verify-booking.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = () => createClient(URL, ANON, { auth: { persistSession: false } });

let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? "  — " + extra : ""}`);
  cond ? pass++ : fail++;
};

const rnd = Math.random().toString(36).slice(2, 8);
const emailA = `owner-a-${rnd}@example.com`;
const emailB = `owner-b-${rnd}@example.com`;
const PW = "Test-passw0rd!";
const created = { users: [], gyms: [] };

async function makeOwner(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PW,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  created.users.push(data.user.id);
  const client = anon();
  const { error: sErr } = await client.auth.signInWithPassword({ email, password: PW });
  if (sErr) throw new Error(`signIn: ${sErr.message}`);
  return client;
}

async function firstSession(client, gymId, className) {
  const { data } = await client
    .from("class_sessions")
    .select("id, capacity, booked_count, classes!inner(name)")
    .eq("gym_id", gymId)
    .order("starts_at", { ascending: true });
  const rows = data ?? [];
  const match = rows.find((r) =>
    Array.isArray(r.classes) ? r.classes[0]?.name === className : r.classes?.name === className,
  );
  return match ?? rows[0];
}

async function addClass(client, gymId, name, capacity, weekday) {
  const { data: cls } = await client
    .from("classes")
    .insert({ gym_id: gymId, name, capacity, duration_min: 60 })
    .select("id")
    .single();
  const { data: sch } = await client
    .from("class_schedules")
    .insert({ gym_id: gymId, class_id: cls.id, weekday, start_time: "18:00", capacity })
    .select("id")
    .single();
  await client.rpc("generate_sessions", { p_schedule_id: sch.id, p_weeks: 8 });
}

try {
  const tomorrowDow = new Date(Date.now() + 86400000).getDay();

  // ---- Studio A ----
  const A = await makeOwner(emailA);
  const { data: sA, error: cErr } = await A.rpc("create_studio", {
    p_name: `Test Studio ${rnd}`,
    p_timezone: "Europe/London",
  });
  ok("Owner A can create a studio", !cErr && Array.isArray(sA) && !!sA[0]?.gym_id, cErr?.message);
  const gymA = sA[0].gym_id;
  created.gyms.push(gymA);

  await addClass(A, gymA, "Capacity2", 2, tomorrowDow);
  await addClass(A, gymA, "Capacity1", 1, tomorrowDow);

  // ---- Waitlist: 3 bookings on a 2-seat session ----
  const s2 = await firstSession(A, gymA, "Capacity2");
  const guest = anon();
  const r1 = await guest.rpc("book_session", { p_session_id: s2.id, p_name: "G1", p_email: `g1-${rnd}@x.com` });
  const r2 = await guest.rpc("book_session", { p_session_id: s2.id, p_name: "G2", p_email: `g2-${rnd}@x.com` });
  const r3 = await guest.rpc("book_session", { p_session_id: s2.id, p_name: "G3", p_email: `g3-${rnd}@x.com` });
  const statuses = [r1, r2, r3].map((r) => r.data?.[0]?.status);
  ok("2 confirmed + 1 waitlisted on a 2-seat class", JSON.stringify(statuses) === JSON.stringify(["confirmed", "confirmed", "waitlisted"]), statuses.join(","));

  // duplicate email rejected
  const dup = await guest.rpc("book_session", { p_session_id: s2.id, p_name: "G1", p_email: `g1-${rnd}@x.com` });
  ok("Duplicate booking by same email is rejected", !!dup.error, dup.error?.message?.slice(0, 40));

  // ---- Concurrency: 6 simultaneous bookings on a 1-seat session ----
  const s1 = await firstSession(A, gymA, "Capacity1");
  const burst = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      anon().rpc("book_session", { p_session_id: s1.id, p_name: `C${i}`, p_email: `c${i}-${rnd}@x.com` }),
    ),
  );
  const confirmedCount = burst.filter((r) => r.data?.[0]?.status === "confirmed").length;
  const { data: s1after } = await A.from("class_sessions").select("booked_count, capacity").eq("id", s1.id).single();
  ok("Exactly 1 confirmed when 6 race for the last seat", confirmedCount === 1, `confirmed=${confirmedCount}`);
  ok("booked_count never exceeds capacity", s1after.booked_count <= s1after.capacity, `${s1after.booked_count}/${s1after.capacity}`);

  // ---- Cancel + auto-promote ----
  const conf = burst.find((r) => r.data?.[0]?.status === "confirmed");
  const tok = conf.data[0].cancel_token;
  const cancelRes = await anon().rpc("cancel_booking", { p_cancel_token: tok });
  ok("Cancel succeeds", !cancelRes.error, cancelRes.error?.message);
  const { data: bookingsAfter } = await A.from("bookings").select("status").eq("session_id", s1.id);
  const confAfter = (bookingsAfter ?? []).filter((b) => b.status === "confirmed").length;
  ok("Cancel auto-promotes a waitlister (still 1 confirmed)", confAfter === 1, `confirmed=${confAfter}`);

  // ---- Tenant isolation ----
  const B = await makeOwner(emailB);
  const { data: sB } = await B.rpc("create_studio", { p_name: `Other ${rnd}`, p_timezone: "UTC" });
  created.gyms.push(sB[0].gym_id);
  const { data: bSeesAClasses } = await B.from("classes").select("id").eq("gym_id", gymA);
  ok("Studio B cannot read Studio A's classes", (bSeesAClasses ?? []).length === 0, `saw ${(bSeesAClasses ?? []).length}`);
  const { data: bSeesABookings } = await B.from("bookings").select("id").eq("gym_id", gymA);
  ok("Studio B cannot read Studio A's bookings", (bSeesABookings ?? []).length === 0, `saw ${(bSeesABookings ?? []).length}`);

  // ---- Anonymous cannot read private tables, but CAN read public view ----
  const { data: anonBookings } = await anon().from("bookings").select("id").limit(1);
  ok("Anonymous cannot read the bookings table", (anonBookings ?? []).length === 0);
  const { data: anonPublic } = await anon().from("public_sessions").select("id").eq("slug", sA[0].slug).limit(1);
  ok("Anonymous CAN read the public booking view", (anonPublic ?? []).length >= 1, `saw ${(anonPublic ?? []).length}`);
} catch (e) {
  console.error("\n💥 Test run error:", e.message);
  fail++;
} finally {
  // cleanup
  for (const g of created.gyms) await admin.from("gyms").delete().eq("id", g);
  for (const u of created.users) await admin.auth.admin.deleteUser(u);
  console.log(`\n${fail === 0 ? "🎉 ALL PASSED" : "⚠️  SOME FAILED"} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
