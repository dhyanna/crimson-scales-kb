-- Crimson Scales KB — Migration v2
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run on existing installation — all statements are idempotent

-- ── ADD NEW COLUMNS ──────────────────────────────────────────
alter table campaign_players
  add column if not exists player_email text;

alter table campaign_players
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ── ADD INDEXES ──────────────────────────────────────────────
create index if not exists idx_campaign_players_user_id
  on campaign_players(user_id);

create index if not exists idx_campaign_players_email
  on campaign_players(player_email);

-- ── UPDATE RLS POLICIES ──────────────────────────────────────
-- Remove old permissive policies
drop policy if exists "allow all campaigns" on campaigns;
drop policy if exists "allow all campaign_players" on campaign_players;

-- Campaigns: open read/insert/delete for now
drop policy if exists "authenticated read campaigns" on campaigns;
drop policy if exists "authenticated insert campaigns" on campaigns;
drop policy if exists "authenticated delete campaigns" on campaigns;

create policy "authenticated read campaigns"
  on campaigns for select using (true);

create policy "authenticated insert campaigns"
  on campaigns for insert with check (true);

create policy "authenticated delete campaigns"
  on campaigns for delete using (true);

-- Campaign players: open read/insert/delete; update restricted to own record
drop policy if exists "authenticated read players" on campaign_players;
drop policy if exists "authenticated insert players" on campaign_players;
drop policy if exists "authenticated delete players" on campaign_players;
drop policy if exists "own player update" on campaign_players;

create policy "authenticated read players"
  on campaign_players for select using (true);

create policy "authenticated insert players"
  on campaign_players for insert with check (true);

create policy "authenticated delete players"
  on campaign_players for delete using (true);

create policy "own player update"
  on campaign_players for update
  using (
    auth.uid() = user_id
    or user_id is null
  );
