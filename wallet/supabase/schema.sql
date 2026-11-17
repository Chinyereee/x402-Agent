-- Receipts wallet: one row per small JSON record (receipts, rules, allowance).
-- Run once in the Supabase SQL editor. Only the server (service role key) reads and writes it.
create table if not exists wallet_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table wallet_state enable row level security;
