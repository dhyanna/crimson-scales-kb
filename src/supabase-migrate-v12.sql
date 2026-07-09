-- v12: Exhaustion state and round tracking

-- Add is_exhausted to scenario_party
alter table scenario_party add column if not exists is_exhausted boolean not null default false;

-- round_number already exists on scenarios table from v11
-- Ensure it's there
alter table scenarios add column if not exists round_number int not null default 0;

-- Add play_state JSONB to scenario_party for pause/resume persistence
alter table scenario_party add column if not exists play_state jsonb not null default '{}';
