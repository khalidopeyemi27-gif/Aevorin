-- 004_navigation_state.sql

ALTER TABLE user_workspace_state ADD COLUMN navigation_state_json TEXT DEFAULT '[]';
