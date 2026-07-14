import { supabase } from "./supabase";

// Roster mutations that touch credentials (creating an athlete, changing a PIN
// or name, deleting) must also create/update/delete the matching Supabase Auth
// user — which requires the service-role key. That key can never ship in this
// bundle, so these calls go through the roster-admin edge function, which
// verifies the caller is the coach before acting.
export async function rosterAdmin(action, payload) {
  const { data, error } = await supabase.functions.invoke("roster-admin", {
    body: { action, ...payload },
  });
  if (error) return { ok: false, error };
  if (data?.error) return { ok: false, error: { message: data.error } };
  return { ok: true, data };
}
