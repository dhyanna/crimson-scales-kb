-- v17: persist replay info on scenarios table so it survives page refreshes
alter table scenarios add column if not exists is_replay boolean not null default false;
alter table scenarios add column if not exists replay_number int;
