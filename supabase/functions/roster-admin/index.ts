// Roster operations that must touch Supabase Auth (create athlete, change PIN,
// rename, delete). Runs with the service-role key server-side; only a signed-in
// coach (per the coaches table) may call it.
//
// Deploy:  supabase functions deploy roster-admin --project-ref juwxlrbkpeluojtqcplt
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are injected
// automatically by the platform.)

import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Keep in sync with src/lib/auth.js and scripts/create-auth-users.mjs.
const nameSlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const athleteEmail = (name: string) => `${nameSlug(name)}@athletes.riptidestrength.app`;
const athletePassword = (pin: string) => `${pin}::riptide-strength`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json("ok");

  // Identify the caller from their JWT and require coach membership.
  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return json({ error: "Not signed in" }, 401);

  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: coachRow } = await admin.from("coaches").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!coachRow) return json({ error: "Coach access required" }, 403);

  const body = await req.json();
  const { action } = body;

  try {
    if (action === "create") {
      // body.athlete: full roster row (id, name, event, ...); body.pin: initial PIN
      const { athlete, pin } = body;
      if (!athlete?.name || !pin) return json({ error: "Name and PIN required" }, 400);
      const { data: created, error: userErr } = await admin.auth.admin.createUser({
        email: athleteEmail(athlete.name),
        password: athletePassword(pin),
        email_confirm: true,
        app_metadata: { role: "athlete", athleteId: athlete.id },
      });
      if (userErr) return json({ error: userErr.message }, 400);
      const row = { ...athlete, pin: null, user_id: created.user.id };
      const { error: rowErr } = await admin.from("athletes").insert(row);
      if (rowErr) {
        await admin.auth.admin.deleteUser(created.user.id); // don't leave an orphan
        return json({ error: rowErr.message }, 400);
      }
      return json({ athlete: row });
    }

    if (action === "update") {
      // body.athlete: full roster row to save; body.pin: new PIN or null/absent
      const { athlete, pin } = body;
      const { data: existing, error: exErr } = await admin.from("athletes").select("id,name,user_id").eq("id", athlete.id).single();
      if (exErr) return json({ error: exErr.message }, 400);
      const renamed = existing.name !== athlete.name;
      if (existing.user_id && (renamed || pin)) {
        const attrs: Record<string, unknown> = {};
        if (renamed) attrs.email = athleteEmail(athlete.name);
        if (pin) attrs.password = athletePassword(pin);
        const { error: updErr } = await admin.auth.admin.updateUserById(existing.user_id, attrs);
        if (updErr) return json({ error: updErr.message }, 400);
      }
      const row = { ...athlete, pin: null };
      const { error: rowErr } = await admin.from("athletes").update(row).eq("id", athlete.id);
      if (rowErr) return json({ error: rowErr.message }, 400);
      return json({ athlete: row });
    }

    if (action === "delete") {
      const { athleteId } = body;
      const { data: existing } = await admin.from("athletes").select("user_id").eq("id", athleteId).single();
      const { error: rowErr } = await admin.from("athletes").delete().eq("id", athleteId);
      if (rowErr) return json({ error: rowErr.message }, 400);
      if (existing?.user_id) await admin.auth.admin.deleteUser(existing.user_id);
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
