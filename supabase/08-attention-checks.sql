-- "Checked" marks on Needs attention rows.
--
-- A check hides one flag for one athlete until something actually changes:
-- each flag reports a state string (missed-session count and latest date, or
-- how many sessions carry an RPE), and the flag comes back as soon as that
-- state differs from what the coach checked off. So a swimmer who misses
-- another session reappears, and one who simply hasn't logged yet stays quiet.
--
-- Coach-only: athletes can't see or write these rows.
-- Safe to re-run.

create table if not exists attention_checks (
  athlete_id text not null references athletes(id) on delete cascade,
  kind       text not null,                       -- quiet | ramp | flat
  state      text not null,                       -- what the flag looked like when checked
  checked_at timestamptz not null default now(),
  primary key (athlete_id, kind)
);

alter table attention_checks enable row level security;

drop policy if exists "coach read"   on attention_checks;
drop policy if exists "coach insert" on attention_checks;
drop policy if exists "coach update" on attention_checks;
drop policy if exists "coach delete" on attention_checks;

create policy "coach read"   on attention_checks for select to authenticated using (is_coach());
create policy "coach insert" on attention_checks for insert to authenticated with check (is_coach());
create policy "coach update" on attention_checks for update to authenticated using (is_coach()) with check (is_coach());
create policy "coach delete" on attention_checks for delete to authenticated using (is_coach());

revoke all on attention_checks from anon;
grant select, insert, update, delete on attention_checks to authenticated;
