-- v11: Phase tracking, Scenario Session Manager

-- ── Phase tracking on campaigns ──────────────────────────────────
alter table campaigns add column if not exists phase text not null default 'city';
-- phase values: 'city' | 'scenario'
alter table campaigns add column if not exists city_step text not null default 'downtime';
-- city_step values: 'city_event' | 'downtime' (only relevant when phase = 'city')

-- ── Scenarios table ───────────────────────────────────────────────
create table if not exists scenarios (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid references campaigns(id) on delete cascade not null,
  scenario_number   int not null,
  scenario_name     text not null,
  scenario_goal     text,                          -- max 256 chars, enforced in app
  gm_player_id      uuid references players(id),
  status            text not null default 'active',
  -- status values: 'active' | 'paused' | 'completed' | 'lost' | 'abandoned'
  scenario_step     text not null default 'beginning',
  -- scenario_step values: 'beginning' | 'playing' | 'ending'
  round_number      int not null default 1,
  forced_link       boolean not null default false,
  replay            boolean not null default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_scenarios_campaign_id on scenarios(campaign_id);

-- ── Scenario party table ──────────────────────────────────────────
create table if not exists scenario_party (
  id                    uuid primary key default gen_random_uuid(),
  scenario_id           uuid references scenarios(id) on delete cascade not null,
  character_id          uuid references characters(id) on delete cascade not null,
  player_id             uuid references players(id) not null,
  battle_goal_card      text,                      -- e.g. 'bg-001'
  battle_goal_checks    int not null default 0,
  battle_goal_completed boolean not null default false,
  is_absent             boolean not null default false,
  substitute_player_id  uuid references players(id),
  initiative            int,                       -- current round initiative
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(scenario_id, character_id)
);

create index idx_scenario_party_scenario_id on scenario_party(scenario_id);
create index idx_scenario_party_character_id on scenario_party(character_id);

-- ── RLS policies ──────────────────────────────────────────────────
alter table scenarios      enable row level security;
alter table scenario_party enable row level security;

create policy "all scenarios"       on scenarios       for all using (true) with check (true);
create policy "all scenario_party"  on scenario_party  for all using (true) with check (true);
