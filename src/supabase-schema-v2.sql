-- Crimson Scales KB — Schema v2 (clean redesign)
-- Run this AFTER wiping existing tables in Supabase
-- Wipe order (run first):
--   drop table if exists character_cards cascade;
--   drop table if exists character_state cascade;
--   drop table if exists campaign_pq_deck cascade;
--   drop table if exists campaign_unlocked_classes cascade;
--   drop table if exists campaign_players cascade;
--   drop table if exists campaigns cascade;

-- ── CAMPAIGNS ────────────────────────────────────────────────
create table campaigns (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  party_name     text,
  starting_group text not null,
  created_at     timestamptz default now()
);

-- ── PLAYERS ──────────────────────────────────────────────────
-- Real people participating in a campaign
create table players (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid references campaigns(id) on delete cascade,
  player_name    text not null,
  player_email   text,
  user_id        uuid references auth.users(id) on delete set null,
  created_at     timestamptz default now()
);

create index idx_players_campaign_id on players(campaign_id);
create index idx_players_user_id on players(user_id);
create index idx_players_email on players(player_email);

-- ── CHARACTERS ───────────────────────────────────────────────
-- Instances of a class within a campaign
create table characters (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid references campaigns(id) on delete cascade,
  class_id           text not null,
  character_name     text,
  status             text not null default 'active',
  -- 'active' | 'set_aside' | 'retired'
  assigned_player_id uuid references players(id) on delete set null,
  pq_card_id         text,
  retired_at         timestamptz,
  set_aside_at       timestamptz,
  retired_level      int,
  retired_by_player_id uuid references players(id) on delete set null,
  created_at         timestamptz default now()
);

create index idx_characters_campaign_id on characters(campaign_id);
create index idx_characters_assigned_player_id on characters(assigned_player_id);

-- Enforce one active character per player
create unique index idx_one_active_char_per_player
  on characters(assigned_player_id)
  where status = 'active' and assigned_player_id is not null;

-- ── CHARACTER STATE ──────────────────────────────────────────
create table character_state (
  id                uuid primary key default gen_random_uuid(),
  character_id      uuid references characters(id) on delete cascade unique,
  current_level     int not null default 1,
  milestone_checks  int not null default 0,
  milestone_earned  boolean not null default false,
  hand_size         int not null default 10,
  passed_over_cards jsonb not null default '[]',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_character_state_character_id on character_state(character_id);

-- ── CHARACTER CARDS ──────────────────────────────────────────
create table character_cards (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid references characters(id) on delete cascade,
  card_id         text not null,
  class_id        text not null,
  in_hand         boolean not null default false,
  level_obtained  int,
  created_at      timestamptz default now()
);

create index idx_character_cards_character_id on character_cards(character_id);

-- ── PQ DECK ──────────────────────────────────────────────────
create table campaign_pq_deck (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references campaigns(id) on delete cascade,
  pq_card_id    text not null,
  is_removed    boolean not null default false,
  drawn_by      uuid references characters(id) on delete set null,
  drawn_at      timestamptz,
  created_at    timestamptz default now()
);

create index idx_pq_deck_campaign_id on campaign_pq_deck(campaign_id);
create index idx_pq_deck_drawn_by on campaign_pq_deck(drawn_by);

-- ── UNLOCKED CLASSES ─────────────────────────────────────────
create table campaign_unlocked_classes (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references campaigns(id) on delete cascade,
  class_id      text not null,
  unlocked_at   timestamptz default now()
);

create index idx_unlocked_classes_campaign_id on campaign_unlocked_classes(campaign_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table campaigns enable row level security;
alter table players enable row level security;
alter table characters enable row level security;
alter table character_state enable row level security;
alter table character_cards enable row level security;
alter table campaign_pq_deck enable row level security;
alter table campaign_unlocked_classes enable row level security;

create policy "all campaigns"             on campaigns             for all using (true) with check (true);
create policy "all players"               on players               for all using (true) with check (true);
create policy "all characters"            on characters            for all using (true) with check (true);
create policy "all character_state"       on character_state       for all using (true) with check (true);
create policy "all character_cards"       on character_cards       for all using (true) with check (true);
create policy "all campaign_pq_deck"      on campaign_pq_deck      for all using (true) with check (true);
create policy "all campaign_unlocked_classes" on campaign_unlocked_classes for all using (true) with check (true);
