import { supabase } from "./supabase";

// Athletes sign in with the same name + PIN they always have. Underneath, each
// athlete has a Supabase Auth user whose email/password are derived
// deterministically from their name and PIN, so the login screen can build the
// credentials without reading the roster (which anonymous users can't see once
// RLS is locked down). The same derivation lives in scripts/create-auth-users.mjs
// and the roster-admin edge function — keep all three in sync.
export const nameSlug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const athleteEmail = (name) => `${nameSlug(name)}@athletes.riptidestrength.app`;
// PIN + fixed suffix meets the password length minimum. The suffix is public
// (it ships in this bundle), so strength comes from Supabase Auth's server-side
// rate limiting — the same PINs were previously readable outright, so this is
// strictly an upgrade. Not name-derived, so renames don't invalidate PINs.
export const athletePassword = (pin) => `${pin}::riptide-strength`;

export async function signInAthlete(name, pin) {
  const { error } = await supabase.auth.signInWithPassword({
    email: athleteEmail(name),
    password: athletePassword(pin),
  });
  return { ok: !error, error };
}

export async function signInCoach(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { ok: !error, error };
}

export function signOut() {
  return supabase.auth.signOut();
}

// Role comes from app_metadata, which only the service role can set — an
// athlete can't promote themselves from the client.
export const sessionRole = (session) => session?.user?.app_metadata?.role || null;
