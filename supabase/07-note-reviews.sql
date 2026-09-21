-- Pain / injury note flags: the coach's "Mark addressed" record.
--
-- Athlete notes that mention pain or injury raise a flag in Needs attention.
-- The flag stays up until the coach marks that session addressed. If the
-- athlete edits their notes afterwards (loggedAt moves on), the flag comes back
-- so a new complaint can't hide behind an old review.
--
-- Coach-only: athletes can't see or write these rows.
-- Safe to re-run.

create table if not exists note_reviews (
  log_id             bigint primary key references logs(id) on delete cascade,
  reviewed_logged_at bigint not null,          -- the loggedAt of the version the coach saw
  reviewed_at        timestamptz not null default now()
);

alter table note_reviews enable row level security;

drop policy if exists "coach read"   on note_reviews;
drop policy if exists "coach insert" on note_reviews;
drop policy if exists "coach update" on note_reviews;
drop policy if exists "coach delete" on note_reviews;

create policy "coach read"   on note_reviews for select to authenticated using (is_coach());
create policy "coach insert" on note_reviews for insert to authenticated with check (is_coach());
create policy "coach update" on note_reviews for update to authenticated using (is_coach()) with check (is_coach());
create policy "coach delete" on note_reviews for delete to authenticated using (is_coach());

revoke all on note_reviews from anon;
grant select, insert, update, delete on note_reviews to authenticated;
