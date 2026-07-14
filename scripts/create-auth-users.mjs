// Phase 1: create Supabase Auth users for the coach and every athlete, and
// backfill athletes.user_id. Idempotent — safe to re-run; existing users are
// skipped (or repaired if user_id is missing).
//
// Run locally (the service-role key must never enter the repo or the bundle):
//
//   SUPABASE_SERVICE_ROLE_KEY=... COACH_PASSWORD=... node scripts/create-auth-users.mjs
//
// The coach account is shane.garrahan@gmail.com with COACH_PASSWORD.
// Athlete credentials are derived exactly as in src/lib/auth.js.

import { createClient } from "@supabase/supabase-js";

const URL = "https://juwxlrbkpeluojtqcplt.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const COACH_EMAIL = "shane.garrahan@gmail.com";
const COACH_PASSWORD = process.env.COACH_PASSWORD;

if (!SERVICE_KEY) { console.error("Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
if (!COACH_PASSWORD || COACH_PASSWORD.length < 8) { console.error("Set COACH_PASSWORD (8+ chars)"); process.exit(1); }

// Keep in sync with src/lib/auth.js and supabase/functions/roster-admin.
const nameSlug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const athleteEmail = (name) => `${nameSlug(name)}@athletes.riptidestrength.app`;
const athletePassword = (pin) => `${pin}::riptide-strength`;

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(email) {
  // listUsers has no filter param in this SDK version; page through.
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
}

async function main() {
  // 1. Coach
  let coach = await findUserByEmail(COACH_EMAIL);
  if (!coach) {
    const { data, error } = await admin.auth.admin.createUser({
      email: COACH_EMAIL, password: COACH_PASSWORD, email_confirm: true,
      app_metadata: { role: "coach" },
    });
    if (error) throw error;
    coach = data.user;
    console.log("Created coach auth user");
  } else {
    console.log("Coach auth user already exists");
  }
  const { error: coachRowErr } = await admin.from("coaches").upsert({ user_id: coach.id });
  if (coachRowErr) throw coachRowErr;

  // 2. Athletes
  const { data: athletes, error: athErr } = await admin.from("athletes").select("id,name,pin,user_id");
  if (athErr) throw athErr;
  let created = 0, linked = 0, skipped = 0, failed = 0;
  for (const a of athletes) {
    try {
      if (!a.pin) { console.warn(`SKIP ${a.name}: no PIN on roster row`); skipped++; continue; }
      let user = a.user_id ? { id: a.user_id } : await findUserByEmail(athleteEmail(a.name));
      if (!user) {
        const { data, error } = await admin.auth.admin.createUser({
          email: athleteEmail(a.name), password: athletePassword(a.pin), email_confirm: true,
          app_metadata: { role: "athlete", athleteId: a.id },
        });
        if (error) throw error;
        user = data.user;
        created++;
      }
      if (a.user_id !== user.id) {
        const { error } = await admin.from("athletes").update({ user_id: user.id }).eq("id", a.id);
        if (error) throw error;
        linked++;
      }
    } catch (e) {
      console.error(`FAILED ${a.name}: ${e.message}`);
      failed++;
    }
  }
  console.log(`Done. ${created} users created, ${linked} rows linked, ${skipped} skipped (no PIN), ${failed} failed.`);
  if (skipped || failed) process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
