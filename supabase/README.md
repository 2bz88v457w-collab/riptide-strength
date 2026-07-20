# Supabase Auth migration runbook

Goal: real Supabase Auth (athletes keep name + PIN; coach uses email + password)
and role-based RLS instead of `using (true)`. Written so no phase locks out
active users; the only step with any user-visible risk is Phase 3.

## Roles after migration

| Table | Read | Write |
|---|---|---|
| athletes | signed-in team | coach; athlete may update own row (profile) |
| workouts | signed-in team | coach only |
| logs | signed-in team | athlete: own rows only; coach: all |
| test_scores | signed-in team | coach only |
| progressions (bumps) | signed-in team | coach creates/deletes; athlete deletes own (bump consumption) |
| assessments (movement screens) | coach only | coach only |

## Phase 1 — additive prep (safe anytime; old app unaffected)

1. Dashboard → Authentication → Sign In / Up → Email provider: ON, and turn
   **Confirm email OFF** (athlete emails are synthetic and receive no mail).
2. SQL editor: run `01-additive.sql` (coaches table, `athletes.user_id`, `is_coach()`).
3. Locally, with the service-role key from Project Settings → API (never commit it):

   ```
   SUPABASE_SERVICE_ROLE_KEY=... COACH_PASSWORD=... node scripts/create-auth-users.mjs
   ```

   Creates the coach account (shane.garrahan@gmail.com) + one auth user per
   athlete, and backfills `user_id`. Idempotent; re-run if any rows fail.
4. Deploy the edge function (Supabase CLI, one time):

   ```
   supabase functions deploy roster-admin --project-ref juwxlrbkpeluojtqcplt
   ```

## Phase 2 — deploy the auth app (still no lockout)

Merge the `supabase-auth` branch to main → Vercel deploys. The new app signs
users in properly but the permissive policies are still in place, so even
stale installed PWAs keep working. Verify against production:
coach login with email/password, one athlete login with name + PIN, save a log.
Park here as long as needed (e.g. through Regionals/State).

## Phase 3 — the flip (quiet evening, ~15 min)

Run `02-flip-policies.sql`. New-bundle users notice nothing. Anyone on a stale
PWA bundle sees an empty app until they force-close and reopen. Announce:
"if the app looks empty, close it fully and reopen." Emergency rollback:
`03-rollback.sql` (restores permissive policies, data untouched).

## Phase 4 — cleanup (a few days after a stable flip)

Run `04-cleanup.sql` (nulls the plaintext `pin` column — PINs now exist only
as auth passwords). From then on the Edit Athlete screen shows a blank
"New PIN" field: entering a value resets the athlete's PIN, blank leaves it.

## Security Advisor notes

- The seven "RLS Policy Always True" warnings are the permissive policies
  deliberately kept until Phase 3; `02-flip-policies.sql` clears all of them
  (including the legacy, app-unused `groups` table → coach-only).
- `05-lint-fixes.sql` (safe anytime) revokes anonymous EXECUTE on `is_coach()`.
  The "authenticated can execute" warning that remains is intentional: RLS
  policies run as the signed-in user, so `authenticated` must keep EXECUTE;
  the function only returns whether the caller themself is a coach.
- "Leaked password protection" (Auth settings) is optional to enable; athlete
  passwords are PIN-derived with a suffix, so HaveIBeenPwned collisions are
  effectively impossible, and it adds real protection for the coach password.

## Notes

- Credential derivation (synthetic email from name, password from PIN) lives in
  three places that must stay in sync: `src/lib/auth.js`,
  `scripts/create-auth-users.mjs`, `supabase/functions/roster-admin/index.ts`.
- Renaming an athlete updates their login email automatically (roster-admin);
  their PIN keeps working.
- Two athletes with identical full names cannot both log in (same as the old
  system); differentiate the name on the roster.
