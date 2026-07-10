-- v13: Scenario end tracking

-- Snapshot PQ/milestone checks at scenario start for rollback on abandon
alter table scenario_party add column if not exists pq_checks_start int not null default 0;
alter table scenario_party add column if not exists milestone_checks_start int not null default 0;

-- Treasure tile tracking per player per scenario
alter table scenario_party add column if not exists looted_treasure boolean not null default false;
