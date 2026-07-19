-- Chronological Timeline Events
CREATE TABLE IF NOT EXISTS canon_events (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    position_key TEXT NOT NULL,       -- alphanumeric sortable key e.g. '005.002'
    title TEXT NOT NULL,
    description TEXT,
    importance TEXT DEFAULT 'major',  -- 'major', 'minor'
    status TEXT DEFAULT 'confirmed',  -- 'draft', 'confirmed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_position ON canon_events(project_id, position_key);

-- Character Property State Changes
CREATE TABLE IF NOT EXISTS character_changes (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL, -- Links to entities(id)
    event_id TEXT NOT NULL,     -- Links to canon_events(id)
    position_key TEXT NOT NULL, -- Cached from canon_events for direct sorting
    field TEXT NOT NULL,        -- e.g. 'left_arm', 'status', 'weapon'
    old_value TEXT,
    new_value TEXT NOT NULL,
    FOREIGN KEY(character_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES canon_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_character_position ON character_changes(character_id, position_key);

-- Evolving Relationship Transitions
CREATE TABLE IF NOT EXISTS relationship_changes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    character_a TEXT NOT NULL,  -- Links to entities(id)
    character_b TEXT NOT NULL,  -- Links to entities(id)
    event_id TEXT,              -- Links to canon_events(id)
    position_key TEXT NOT NULL, -- Cached from canon_events
    old_relationship TEXT,
    new_relationship TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(character_a) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(character_b) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES canon_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_relationship_position ON relationship_changes(project_id, position_key);

-- 4. Continuity Scanner Warning Alerts
CREATE TABLE IF NOT EXISTS continuity_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,    -- Links to scenes(id)
    type TEXT NOT NULL,        -- 'character', 'relationship', 'timeline', 'world', 'magic', 'location'
    message TEXT NOT NULL,
    severity TEXT NOT NULL,    -- 'critical', 'warning'
    affected_entity_id TEXT,   -- ID of affected character or relationship entity
    evidence TEXT,             -- The sentence causing the alert
    confidence REAL DEFAULT 1.0, -- Confidence score e.g. 0.95
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'ignored'
    ignored_reason TEXT,       -- Reason notes for ignoring a warning
    resolved INTEGER DEFAULT 0, -- Legacy fallback column
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY(affected_entity_id) REFERENCES entities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_scene ON continuity_reports(scene_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON continuity_reports(project_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON continuity_reports(affected_entity_id);
CREATE INDEX IF NOT EXISTS idx_character_changes_event ON character_changes(event_id);
