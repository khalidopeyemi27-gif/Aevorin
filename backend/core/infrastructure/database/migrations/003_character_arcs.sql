-- Migration: 003_character_arcs.sql
-- Description: Adds character arcs, graph relationships cache, user workspace states, and story entities tables for Narrative Room.

CREATE TABLE IF NOT EXISTS character_arc_events (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  chapter_id TEXT,
  event_type TEXT,
  emotional_state TEXT,
  motivation TEXT,
  belief_change TEXT,
  relationship_change TEXT,
  importance INTEGER DEFAULT 50,
  location_id TEXT,
  trigger_event TEXT
);

CREATE TABLE IF NOT EXISTS graph_relationships_cache (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  importance INTEGER DEFAULT 50,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_workspace_state (
  project_id TEXT PRIMARY KEY,
  active_tab TEXT,
  focused_entity_json TEXT,
  graph_zoom REAL DEFAULT 1.0,
  graph_depth INTEGER DEFAULT 1,
  timeline_position_key TEXT,
  last_view_mode TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_entities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  importance INTEGER DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_char_arc_char ON character_arc_events(character_id);
CREATE INDEX IF NOT EXISTS idx_graph_cache_proj ON graph_relationships_cache(project_id);
CREATE INDEX IF NOT EXISTS idx_story_entities_proj ON story_entities(project_id);
