-- Crimson Scales KB — Migration v8: Party Progress Trackers

-- ── CAMPAIGNS ────────────────────────────────────────────────
alter table campaigns
  add column if not exists scenario_completions  int not null default 0,
  add column if not exists read_37d              boolean not null default false,
  add column if not exists party_goal_side_scenario boolean not null default false,
  add column if not exists read_53a              boolean not null default false;

-- ── PLAYERS ──────────────────────────────────────────────────
alter table players
  add column if not exists is_founding_member      boolean not null default false,
  add column if not exists battle_goals_completed  int not null default 0,
  add column if not exists xp_100_gained           boolean not null default false,
  add column if not exists gold_60_spent           boolean not null default false,
  add column if not exists treasure_looted         boolean not null default false;
