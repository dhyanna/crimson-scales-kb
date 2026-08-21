-- v19: track actual XP/gold progress instead of binary completion flags
alter table players add column if not exists xp_total int not null default 0;
alter table players add column if not exists gold_spent int not null default 0;
