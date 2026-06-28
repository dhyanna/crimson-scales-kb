-- Crimson Scales KB — Migration v6: Atomic PQ card drawing
-- Run in Supabase SQL Editor

alter table campaign_pq_deck
  add column if not exists drawn_by  uuid references campaign_players(id) on delete set null,
  add column if not exists drawn_at  timestamptz;

create index if not exists idx_pq_deck_drawn_by
  on campaign_pq_deck(drawn_by);

-- Stale claim release: drawn_at older than 10 minutes with no assignment
-- We handle this in JS, but the index helps the query
create index if not exists idx_pq_deck_drawn_at
  on campaign_pq_deck(drawn_at);

-- Add retired_level to capture level at time of retirement
alter table campaign_players
  add column if not exists retired_level int;
