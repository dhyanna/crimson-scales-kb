-- v18: campaign archive/restore support
alter table campaigns add column if not exists is_archived boolean not null default false;
alter table campaigns add column if not exists archived_at timestamptz;
