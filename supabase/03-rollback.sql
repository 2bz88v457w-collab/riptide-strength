-- Emergency rollback for 02-flip-policies.sql: restores the permissive
-- anonymous policies so the pre-auth app works again. Data is unchanged.

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

create policy "anon full access" on athletes     for all using (true) with check (true);
create policy "anon full access" on workouts     for all using (true) with check (true);
create policy "anon full access" on logs         for all using (true) with check (true);
create policy "anon full access" on test_scores  for all using (true) with check (true);
create policy "anon full access" on progressions for all using (true) with check (true);
create policy "anon full access" on assessments  for all using (true) with check (true);
create policy "public access"    on groups       for all using (true) with check (true);
