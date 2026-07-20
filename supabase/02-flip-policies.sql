-- Phase 3 (the flip). Run only after:
--   1. 01-additive.sql has been run,
--   2. scripts/create-auth-users.mjs has created all auth users,
--   3. the auth version of the app is deployed and verified.
-- After this runs, anonymous clients (stale PWA bundles) see nothing until the
-- user force-closes and reopens the app. Rollback: 03-rollback.sql.

-- Drop every existing policy on the app tables, whatever they were named.
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('athletes','workouts','logs','test_scores','progressions','assessments','groups')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- athletes: everyone signed in can read the roster; the coach manages it; an
-- athlete may update their own row (profile: school, grade, stroke, distance).
create policy "team read"        on athletes for select to authenticated using (true);
create policy "coach insert"     on athletes for insert to authenticated with check (is_coach());
create policy "coach delete"     on athletes for delete to authenticated using (is_coach());
create policy "own or coach upd" on athletes for update to authenticated
  using (is_coach() or user_id = auth.uid())
  with check (is_coach() or user_id = auth.uid());

-- workouts: team read, coach-only writes.
create policy "team read"    on workouts for select to authenticated using (true);
create policy "coach insert" on workouts for insert to authenticated with check (is_coach());
create policy "coach update" on workouts for update to authenticated using (is_coach());
create policy "coach delete" on workouts for delete to authenticated using (is_coach());

-- logs: team read; athletes write only their own sessions; coach writes all.
create policy "team read" on logs for select to authenticated using (true);
create policy "own or coach insert" on logs for insert to authenticated
  with check (is_coach() or "athleteId" in (select id from athletes where user_id = auth.uid()));
create policy "own or coach update" on logs for update to authenticated
  using (is_coach() or "athleteId" in (select id from athletes where user_id = auth.uid()))
  with check (is_coach() or "athleteId" in (select id from athletes where user_id = auth.uid()));
create policy "coach delete" on logs for delete to authenticated using (is_coach());

-- test_scores: team read, coach-only writes.
create policy "team read"    on test_scores for select to authenticated using (true);
create policy "coach insert" on test_scores for insert to authenticated with check (is_coach());
create policy "coach update" on test_scores for update to authenticated using (is_coach());
create policy "coach delete" on test_scores for delete to authenticated using (is_coach());

-- progressions (coach "bumps"): team read; coach creates; an athlete may
-- delete their own rows — the app consumes a bump (deletes it) from the
-- athlete's device when they save the session it fired in.
create policy "team read"    on progressions for select to authenticated using (true);
create policy "coach insert" on progressions for insert to authenticated with check (is_coach());
create policy "own or coach delete" on progressions for delete to authenticated
  using (is_coach() or "athleteId" in (select id from athletes where user_id = auth.uid()));

-- assessments (movement screens): coach-only, read and write — athletes never
-- use this data in the app, so it never leaves the coach's session.
create policy "coach read"   on assessments for select to authenticated using (is_coach());
create policy "coach insert" on assessments for insert to authenticated with check (is_coach());
create policy "coach delete" on assessments for delete to authenticated using (is_coach());

-- groups: legacy table, unused by the app today (reserved for future custom
-- groups). Coach-only until a feature actually needs it.
create policy "coach only" on groups for all to authenticated
  using (is_coach()) with check (is_coach());
