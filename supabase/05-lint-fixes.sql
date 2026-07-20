-- Security Advisor follow-ups. Safe to run anytime (before or after the flip).

-- is_coach() only needs to be callable by signed-in users (RLS policies run as
-- the querying role, so `authenticated` must keep EXECUTE) and by the service
-- role. Anonymous visitors have no reason to call it.
revoke execute on function public.is_coach() from public;
revoke execute on function public.is_coach() from anon;
grant execute on function public.is_coach() to authenticated;
grant execute on function public.is_coach() to service_role;
