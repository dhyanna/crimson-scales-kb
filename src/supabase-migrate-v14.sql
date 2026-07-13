-- v14: Toast broadcast columns for multiplayer notifications
alter table scenarios add column if not exists toast_message text;
alter table scenarios add column if not exists toast_at timestamptz;
