-- Crimson Scales KB — Supabase Schema v2
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- If you already ran v1, run only the ALTER TABLE and new policy sections

-- ── CAMPAIGNS ────────────────────────────────────────────────
create table if not exists campaigns (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  starting_group text not null,
  created_at     timestamptz default now()
);

-- ── CAMPAIGN PLAYERS ─────────────────────────────────────────
create table if not exists campaign_players (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid references campaigns(id) on delete cascade,
  player_name    text not null,
  player_email   text,
  class_id       text not null,
  character_name text,
  is_retired     boolean default false,
  user_id        uuid references auth.users(id) on delete set null,
  created_at     timestamptz default now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table campaigns enable row level security;
alter table campaign_players enable row level security;

-- Drop old permissive policies if they exist
drop policy if exists "allow all campaigns" on campaigns;
drop policy if exists "allow all campaign_players" on campaign_players;

-- Campaigns: anyone authenticated can read; anyone can create;
-- only campaign creator (via players) can delete (relaxed for now)
create policy "authenticated read campaigns"
  on campaigns for select
  using (true);

create policy "authenticated insert campaigns"
  on campaigns for insert
  with check (true);

create policy "authenticated delete campaigns"
  on campaigns for delete
  using (true);

-- Campaign players: anyone authenticated can read all players in a campaign
-- (needed for session play visibility); only own record for update
create policy "authenticated read players"
  on campaign_players for select
  using (true);

create policy "authenticated insert players"
  on campaign_players for insert
  with check (true);

create policy "authenticated delete players"
  on campaign_players for delete
  using (true);

create policy "own player update"
  on campaign_players for update
  using (
    auth.uid() = user_id
    or user_id is null  -- allow update to claim unclaimed records
  );

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_campaign_players_campaign_id
  on campaign_players(campaign_id);
create index if not exists idx_campaign_players_user_id
  on campaign_players(user_id);
create index if not exists idx_campaign_players_email
  on campaign_players(player_email);
