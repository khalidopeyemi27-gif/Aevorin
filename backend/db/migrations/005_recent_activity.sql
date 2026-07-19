-- 005_recent_activity.sql
CREATE TABLE IF NOT EXISTS user_recent_activity (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    entity_id TEXT,
    entity_type TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recent_activity_project ON user_recent_activity (project_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_timestamp ON user_recent_activity (timestamp DESC);
