-- Crimson Scales KB — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

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
  class_id       text not null,
  character_name text,
  is_retired     boolean default false,
  created_at     timestamptz default now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Enable RLS (required for anon key access)
alter table campaigns enable row level security;
alter table campaign_players enable row level security;

-- Allow anonymous read/write for now (single-party trust model)
-- Tighten these policies later when auth is added
create policy "allow all campaigns"
  on campaigns for all
  using (true)
  with check (true);

create policy "allow all campaign_players"
  on campaign_players for all
  using (true)
  with check (true);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_campaign_players_campaign_id
  on campaign_players(campaign_id);
