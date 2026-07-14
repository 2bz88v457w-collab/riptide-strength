-- Phase 1 (additive, zero user impact — safe to run while the old app is live).
-- Adds the auth plumbing without changing any existing policy.

-- Coach role membership. Rows are inserted by scripts/create-auth-users.mjs.
create table if not exists coaches (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table coaches enable row level security;
-- Signed-in users may check coach membership (needed nowhere client-side today,
-- but harmless); only the service role can write it.
create policy "read coaches" on coaches for select to authenticated using (true);

-- Link each roster row to its auth user. Backfilled by the script.
alter table athletes add column if not exists user_id uuid references auth.users (id);

-- True when the calling user is a coach. SECURITY DEFINER so policies can use
-- it without recursive RLS lookups.
create or replace function is_coach() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from coaches where user_id = auth.uid()) $$;
