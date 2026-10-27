-- 3RM benchmarks per athlete per movement.
--
-- The app estimates a 3RM from logged sets (reps + weight), so a max-out week
-- produces benchmarks with no data entry. This table holds the coach's
-- corrections to those estimates — one row only where an estimate was wrong.
--
-- Athletes need to READ it: their logging screen turns "75% 3RM" into their own
-- weight. Only the coach can write.
-- Safe to re-run.

create table if not exists benchmarks (
  athlete_id text not null references athletes(id) on delete cascade,
  movement   text not null,                      -- lowercased exercise name
  value      numeric not null check (value > 0), -- the 3RM in lbs
  updated_at timestamptz not null default now(),
  primary key (athlete_id, movement)
);

alter table benchmarks enable row level security;

drop policy if exists "team read"    on benchmarks;
drop policy if exists "coach insert" on benchmarks;
drop policy if exists "coach update" on benchmarks;
drop policy if exists "coach delete" on benchmarks;

create policy "team read"    on benchmarks for select to authenticated using (true);
create policy "coach insert" on benchmarks for insert to authenticated with check (is_coach());
create policy "coach update" on benchmarks for update to authenticated using (is_coach()) with check (is_coach());
create policy "coach delete" on benchmarks for delete to authenticated using (is_coach());

revoke all on benchmarks from anon;
grant select, insert, update, delete on benchmarks to authenticated;
