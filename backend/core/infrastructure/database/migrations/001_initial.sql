-- Project Metadata Table
CREATE TABLE IF NOT EXISTS project_metadata (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    narrative_mode TEXT DEFAULT 'novel',
    writing_mode TEXT DEFAULT 'traditional',
    target_word_count INTEGER DEFAULT 80000,
    cover_image TEXT,
    app_version TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    created_with TEXT NOT NULL,
    last_opened_with TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    name TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 0 -- 0 = Disabled, 1 = Enabled
);

-- Chapters Table (Manuscript container)
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    act TEXT DEFAULT 'Act I',
    purpose TEXT DEFAULT '',
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'writing', 'complete', 'review')),
    act_index INTEGER DEFAULT 1,
    summary TEXT DEFAULT '',
    conflict TEXT DEFAULT '',
    goal TEXT DEFAULT '',
    chapter_number INTEGER DEFAULT 1,
    timeline_position TEXT DEFAULT '{}',
    estimated_word_count INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    emotional_target TEXT DEFAULT '',
    reader_effect TEXT DEFAULT '',
    theme_focus TEXT DEFAULT '',
    chapter_question TEXT DEFAULT '',
    turning_point TEXT DEFAULT '',
    consequence TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chapters_act ON chapters(project_id, act_index, order_index);

-- Scenes Table (Story text & metadata)
CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    chapter_id TEXT, -- Nullable (can exist outside manuscript chapter structure)
    title TEXT NOT NULL,
    content TEXT, -- TipTap JSON string
    summary TEXT,
    order_index INTEGER NOT NULL, -- Sorting index within chapter
    pov_entity_id TEXT, -- POV Character Entity ID
    purpose TEXT, -- Scene narrative purpose
    conflict TEXT,
    outcome TEXT,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'in_progress', 'polished'
    mood TEXT,
    tags TEXT, -- JSON array of tags (e.g. '["mystery"]')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

-- Unified Entity Table (Characters, locations, organizations, items, magic)
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'character', 'location', 'faction', 'item', 'magic', 'race', 'religion'
    title TEXT NOT NULL,
    summary TEXT,
    metadata TEXT, -- JSON payload storing specific template fields (age, eyes, custom values)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Scene Entity Map (Links entities directly to scenes for automatic index generation and search)
CREATE TABLE IF NOT EXISTS scene_entities (
    scene_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'participant', 'mentioned', 'setting'
    PRIMARY KEY (scene_id, entity_id),
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Rich Knowledge Graph Relationships
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    source_id TEXT NOT NULL, -- Entity ID
    source_type TEXT NOT NULL, -- 'entity'
    target_id TEXT NOT NULL, -- Entity ID
    target_type TEXT NOT NULL, -- 'entity'
    relation_type TEXT NOT NULL, -- 'enemy_of', 'sibling', 'located_in', 'member_of', 'mentor'
    strength INTEGER DEFAULT 100, -- 0 to 100
    trust INTEGER DEFAULT 100, -- 0 to 100
    since_chapter TEXT,
    until_chapter TEXT,
    is_hidden INTEGER DEFAULT 0, -- Secret flag
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Story Bible Table
CREATE TABLE IF NOT EXISTS story_bible (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 'rules', 'power_system', 'tone', 'naming_rules'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    chronological_date TEXT NOT NULL, -- Sorting format 'YYYY-MM-DD' or custom
    scene_id TEXT, -- Associated scene link
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE SET NULL
);

-- Version History (Diff snapshots)
CREATE TABLE IF NOT EXISTS version_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'scene', 'entity'
    entity_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL, -- TipTap JSON or metadata snapshot
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Prompt Library Table
CREATE TABLE IF NOT EXISTS prompt_library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    template_text TEXT NOT NULL,
    is_custom INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assets Manager Table
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Asset Links Table (maps media files to scenes, characters, or locations)
CREATE TABLE IF NOT EXISTS asset_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'scene', 'entity'
    entity_id TEXT NOT NULL,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'export', 'ai'
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Content Attribution Table (Granular tracking of human vs. AI text segments)
CREATE TABLE IF NOT EXISTS content_attribution (
    id TEXT PRIMARY KEY, -- UUID
    project_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'scene', 'entity'
    entity_id TEXT NOT NULL,
    source TEXT NOT NULL, -- 'human', 'ai_generated', 'ai_suggestion', 'imported'
    accepted INTEGER DEFAULT 1, -- Boolean
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- AI Cache Table (Placeholder for v2.0 implementation)
CREATE TABLE IF NOT EXISTS ai_cache (
    prompt_hash TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session Restore Table
CREATE TABLE IF NOT EXISTS session_restore (
    project_id TEXT PRIMARY KEY,
    active_scene_id TEXT,
    cursor_position INTEGER DEFAULT 0,
    open_tabs TEXT, -- JSON string array of active panel tab states
    workspace_layout TEXT, -- JSON state layout
    last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Local Usage Insights Table (Privacy-safe analytics — never stores content)
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Manuscript Versions (Checkpoints)
CREATE TABLE IF NOT EXISTS manuscript_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    chapter_id TEXT,
    scene_id TEXT,
    content_snapshot TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Entity Mentions Tracker
CREATE TABLE IF NOT EXISTS entity_mentions (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    first_position INTEGER DEFAULT 0,
    FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

-- Entity Co-occurrence Relationships Graph
CREATE TABLE IF NOT EXISTS entity_relationships (
    entity_a TEXT NOT NULL,
    entity_b TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    weight INTEGER DEFAULT 100,
    PRIMARY KEY (entity_a, entity_b),
    FOREIGN KEY(entity_a) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_b) REFERENCES entities(id) ON DELETE CASCADE
);

-- Story DNA Table
CREATE TABLE IF NOT EXISTS story_dna (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    theme TEXT DEFAULT '',
    core_question TEXT DEFAULT '',
    reader_promise TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    tone TEXT DEFAULT '',
    ending_feeling TEXT DEFAULT '',
    world_rules TEXT DEFAULT '',
    main_character_arc TEXT DEFAULT '',
    central_conflict TEXT DEFAULT '',
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);

-- Story Threads Table & Mappings
CREATE TABLE IF NOT EXISTS story_threads (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('character_arc','mystery','world_rule','symbol','relationship','plot')),
    created_chapter TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'resolved', 'ignored')),
    description TEXT DEFAULT '',
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_story_threads_proj ON story_threads(project_id);

CREATE TABLE IF NOT EXISTS thread_chapters (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('introduced','developed','changed','resolved')),
    FOREIGN KEY(thread_id) REFERENCES story_threads(id) ON DELETE CASCADE,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_thread_chapters_thread ON thread_chapters(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_chapters_chapter ON thread_chapters(chapter_id);

-- Story Insights & Writer Decisions Tables
CREATE TABLE IF NOT EXISTS story_insights (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('structure','characters','mysteries','timeline','world')),
    severity TEXT NOT NULL CHECK(severity IN ('info','warning','critical')),
    message TEXT NOT NULL,
    source TEXT DEFAULT 'narrative_engine',
    resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_story_insights_proj ON story_insights(project_id);

CREATE TABLE IF NOT EXISTS writer_decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    insight_id TEXT,
    topic TEXT NOT NULL,
    decision TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_writer_decisions_proj ON writer_decisions(project_id);

-- Snapshot Memories Tables
CREATE TABLE IF NOT EXISTS story_snapshots (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    version_type TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_story_snapshots_proj ON story_snapshots(project_id);

-- Chapter Link & History Extensions Tables
CREATE TABLE IF NOT EXISTS chapter_history (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT DEFAULT '',
    source TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chapter_history_ch ON chapter_history(chapter_id);
CREATE INDEX IF NOT EXISTS idx_history_date ON chapter_history(created_at);

CREATE TABLE IF NOT EXISTS chapter_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    source_chapter_id TEXT NOT NULL,
    target_chapter_id TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK(relationship IN ('foreshadows','continues','causes','contrasts','references','mirrors','resolves','introduces','reveals','pays_off','character_arc','world_building')),
    strength INTEGER DEFAULT 50,
    description TEXT DEFAULT '',
    FOREIGN KEY(project_id) REFERENCES project_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(source_chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY(target_chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chapter_links_proj ON chapter_links(project_id);
CREATE INDEX IF NOT EXISTS idx_chapter_links_source ON chapter_links(source_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_links_target ON chapter_links(target_chapter_id);

CREATE TABLE IF NOT EXISTS chapter_versions (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    version_type TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_ch ON chapter_versions(chapter_id);

-- Insert Default Feature Flags
INSERT OR IGNORE INTO feature_flags (name, enabled) VALUES 
('HUMAN_ONLY_MODE', 1),
('AI_ENABLED', 0),
('CLOUD_CONNECTIONS', 0),
('AI_NARRATIVE_BRAIN', 0),
('RELATIONSHIP_GRAPH', 1),
('PLUGIN_API_V2', 0),
('COLLABORATION', 0),
('SCREENPLAY_MODE', 1),
('LOCAL_LLM', 1),
('ADVANCED_ANALYTICS', 1);
