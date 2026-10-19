-- v20: Merchant's Guild Hall tracker (unlocked by reading Section 37D)
-- guild_progress: successfully completed non-replay scenarios toward the next reward (0-4)
-- guild_pending:  rewards the CM has earned but not yet chosen
-- guild_rewards:  keys of rewards already chosen (e.g. "scenario_52", "prosperity_1")
alter table campaigns add column if not exists guild_progress int not null default 0;
alter table campaigns add column if not exists guild_pending int not null default 0;
alter table campaigns add column if not exists guild_rewards jsonb not null default '[]'::jsonb;

-- Campaigns that already read Section 37D: the party chose Scenario 52 as the
-- first-read reward.
update campaigns
set guild_rewards = '["scenario_52"]'::jsonb
where read_37d = true and guild_rewards = '[]'::jsonb;
