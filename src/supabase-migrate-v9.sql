-- v9: Active campaign flag and player roles
alter table campaigns add column if not exists is_active boolean default false;
alter table players add column if not exists role text default 'player';
