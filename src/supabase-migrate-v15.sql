-- v15: Independent group check tracking for grouped PQ cards (e.g. CS-344)
alter table character_state add column if not exists pq_group_checks jsonb default '{}';

-- Player notes field on character_state
alter table character_state add column if not exists notes text default '';
