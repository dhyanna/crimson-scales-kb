-- Crimson Scales KB — Migration v4
-- Adds party_name to campaigns table
-- Run in Supabase SQL Editor

alter table campaigns
  add column if not exists party_name text;
