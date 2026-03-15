-- ============================================================
--  Migration: add LOCKED status + update quests check constraint
--  Run this in the Supabase SQL Editor.
-- ============================================================

alter table quests
  drop constraint if exists quests_status_check;

alter table quests
  add constraint quests_status_check
  check (status in ('ACTIVE', 'COMPLETED', 'FAILED', 'LOCKED'));
