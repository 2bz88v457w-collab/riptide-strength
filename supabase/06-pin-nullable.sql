-- Auth migration follow-up (should have been in 01-additive.sql).
-- The roster-admin edge function nulls the plaintext pin column when it
-- creates/updates an athlete (PINs live in Supabase Auth now), and Phase 4
-- cleanup nulls it wholesale. The original schema made pin NOT NULL, so those
-- writes fail with "null value in column pin violates not-null constraint".
-- Run once; safe anytime. No client code reads pin after the auth migration.
alter table athletes alter column pin drop not null;

-- Also add the championship-tag column the app has always written but which
-- was never actually created (coach Edit Athlete sends champTag on every save).
-- Quoted to preserve camelCase so it matches the client's a.champTag reads.
alter table athletes add column if not exists "champTag" text;
