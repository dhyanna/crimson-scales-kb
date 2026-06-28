-- Crimson Scales KB — Migration v7
-- Add retired_by_player_id to characters table
alter table characters
  add column if not exists retired_by_player_id uuid references players(id) on delete set null;
