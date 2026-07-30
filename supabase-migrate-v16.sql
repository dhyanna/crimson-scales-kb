-- v16: Campaign Adventure Log

-- Scenario log table
create table if not exists scenario_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  scenario_id uuid references scenarios(id) on delete set null,
  scenario_number int not null,
  scenario_name text not null,
  is_replay boolean not null default false,
  replay_number int,
  result text not null, -- 'completed' | 'completed_forced_link' | 'lost_return' | 'lost_replay'
  party_names text[] not null default '{}',
  cp_number int, -- null if no city phase (forced link or replay)
  scenario_log_url text,
  cp_log_url text,
  created_at timestamptz default now()
);

create index if not exists idx_scenario_log_campaign_id on scenario_log(campaign_id);

-- Add cp_count to campaigns
alter table campaigns add column if not exists cp_count int not null default 0;
