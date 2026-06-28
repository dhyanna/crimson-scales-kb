-- Crimson Scales KB — Migration v5: Personal Quests & Character Lifecycle
-- Run in Supabase SQL Editor

-- ── PQ DECK ──────────────────────────────────────────────────
-- Tracks the remaining PQ cards in the campaign deck
create table if not exists campaign_pq_deck (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references campaigns(id) on delete cascade,
  pq_card_id    text not null,   -- e.g. 'cs-pq-330', 'toa-pq-641'
  is_removed    boolean not null default false,  -- permanently removed from deck
  created_at    timestamptz default now()
);

-- ── UNLOCKED CLASSES ─────────────────────────────────────────
-- Tracks which classes are unlocked for a campaign
create table if not exists campaign_unlocked_classes (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references campaigns(id) on delete cascade,
  class_id      text not null,
  unlocked_at   timestamptz default now()
);

-- ── CHARACTER UPDATES ────────────────────────────────────────
-- Add PQ and lifecycle columns to campaign_players
alter table campaign_players
  add column if not exists pq_card_id     text,       -- assigned PQ card
  add column if not exists character_name text,       -- named at first deck builder open
  add column if not exists status         text not null default 'active',
  -- status: 'active' | 'set_aside' | 'retired'
  add column if not exists retired_at     timestamptz,
  add column if not exists set_aside_at   timestamptz;

-- ── RLS ──────────────────────────────────────────────────────
alter table campaign_pq_deck enable row level security;
alter table campaign_unlocked_classes enable row level security;

create policy "read pq_deck"   on campaign_pq_deck for select using (true);
create policy "insert pq_deck" on campaign_pq_deck for insert with check (true);
create policy "update pq_deck" on campaign_pq_deck for update using (true);
create policy "delete pq_deck" on campaign_pq_deck for delete using (true);

create policy "read unlocked_classes"   on campaign_unlocked_classes for select using (true);
create policy "insert unlocked_classes" on campaign_unlocked_classes for insert with check (true);
create policy "delete unlocked_classes" on campaign_unlocked_classes for delete using (true);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_pq_deck_campaign_id
  on campaign_pq_deck(campaign_id);
create index if not exists idx_unlocked_classes_campaign_id
  on campaign_unlocked_classes(campaign_id);
