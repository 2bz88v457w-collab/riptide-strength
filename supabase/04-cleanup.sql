-- Phase 4 (cleanup). Run once the flip has been stable for a few days.
-- PINs now live only inside Supabase Auth as password material; the plaintext
-- copies in the athletes table were the worst part of the old setup.
update athletes set pin = null;
