-- Crimson Scales KB — Migration v3: Deck Builder
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── CHARACTER STATE ──────────────────────────────────────────
create table if not exists character_state (
  id                 uuid primary key default gen_random_uuid(),
  player_id          uuid references campaign_players(id) on delete cascade unique,
  current_level      int not null default 1,
  milestone_checks   int not null default 0,
  milestone_earned   boolean not null default false,
  hand_size          int not null default 10,
  passed_over_cards  jsonb not null default '[]',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ── CHARACTER CARDS ──────────────────────────────────────────
create table if not exists character_cards (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid references campaign_players(id) on delete cascade,
  card_id         text not null,
  class_id        text not null,
  in_hand         boolean not null default false,
  level_obtained  int,
  created_at      timestamptz default now()
);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_character_state_player_id
  on character_state(player_id);
create index if not exists idx_character_cards_player_id
  on character_cards(player_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table character_state enable row level security;
alter table character_cards enable row level security;

create policy "read character_state"   on character_state for select using (true);
create policy "insert character_state" on character_state for insert with check (true);
create policy "update character_state" on character_state for update using (true);
create policy "delete character_state" on character_state for delete using (true);

create policy "read character_cards"   on character_cards for select using (true);
create policy "insert character_cards" on character_cards for insert with check (true);
create policy "update character_cards" on character_cards for update using (true);
create policy "delete character_cards" on character_cards for delete using (true);
