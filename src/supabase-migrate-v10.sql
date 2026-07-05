-- v10: PQ progress tracking on character_state
alter table character_state add column if not exists pq_checks int not null default 0;
alter table character_state add column if not exists pq_completed boolean not null default false;
