-- PostgreSQL Schema for AEVORIN (Migrated from SQLite)

-- 1. Core Tables
CREATE TABLE IF NOT EXISTS project_metadata (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_word_count INTEGER DEFAULT 80000,
    cover_image TEXT
);

CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    act TEXT DEFAULT 'Act I',
    act_index INTEGER DEFAULT 1,
    summary TEXT DEFAULT '',
    conflict TEXT DEFAULT '',
    goal TEXT DEFAULT '',
    purpose TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',
    chapter_number INTEGER DEFAULT 1,
    timeline_position TEXT DEFAULT '{}',
    estimated_word_count INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    emotional_target TEXT DEFAULT '',
    reader_effect TEXT DEFAULT '',
    theme_focus TEXT DEFAULT '',
    chapter_question TEXT DEFAULT '',
    turning_point TEXT DEFAULT '',
    consequence TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content_json TEXT DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    word_count INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Entities & Knowledge
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('character', 'location', 'item', 'lore', 'faction')),
    title TEXT NOT NULL,
    aliases TEXT DEFAULT '[]',
    metadata TEXT DEFAULT '{}',
    content_json TEXT DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entity_mentions (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    count INTEGER DEFAULT 0,
    first_position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS entity_relationships (
    entity_a TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    entity_b TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    weight INTEGER DEFAULT 100,
    PRIMARY KEY (entity_a, entity_b)
);

CREATE TABLE IF NOT EXISTS canon_rules (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('physical', 'psychological', 'historical', 'magical', 'technological', 'relational', 'event')),
    confidence REAL DEFAULT 1.0,
    source_scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_changes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
    timestamp INTEGER DEFAULT 0,
    attribute_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    cause TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS continuity_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
    violated_rule_id TEXT REFERENCES canon_rules(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('minor', 'major', 'critical')),
    affected_entity_id TEXT,
    confidence REAL DEFAULT 1.0,
    status TEXT DEFAULT 'active',
    ignored_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Narrative Intelligence & Insights
CREATE TABLE IF NOT EXISTS story_dna (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE REFERENCES project_metadata(id) ON DELETE CASCADE,
    theme TEXT DEFAULT '',
    core_question TEXT DEFAULT '',
    reader_promise TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    tone TEXT DEFAULT '',
    ending_feeling TEXT DEFAULT '',
    world_rules TEXT DEFAULT '',
    main_character_arc TEXT DEFAULT '',
    central_conflict TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS story_threads (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('character_arc','mystery','world_rule','symbol','relationship','plot')),
    created_chapter TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'resolved', 'ignored')),
    description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS thread_chapters (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES story_threads(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('introduced','developed','changed','resolved'))
);

CREATE TABLE IF NOT EXISTS story_insights (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK(category IN ('structure','characters','mysteries','timeline','world')),
    severity TEXT NOT NULL CHECK(severity IN ('info','warning','critical')),
    message TEXT NOT NULL,
    source TEXT DEFAULT 'narrative_engine',
    resolved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS writer_decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    insight_id TEXT,
    topic TEXT NOT NULL,
    decision TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Versions & History
CREATE TABLE IF NOT EXISTS manuscript_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    chapter_id TEXT,
    scene_id TEXT,
    content_snapshot TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chapter_history (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT DEFAULT '',
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chapter_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    source_chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    target_chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL CHECK(relationship IN ('foreshadows','continues','causes','contrasts','references','mirrors','resolves','introduces','reveals','pays_off','character_arc','world_building')),
    strength INTEGER DEFAULT 50,
    description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS chapter_versions (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    snapshot_json TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    version_type TEXT DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_snapshots (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project_metadata(id) ON DELETE CASCADE,
    snapshot_json TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    version_type TEXT DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chapters_proj ON chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_act ON chapters(project_id, act_index, order_index);
CREATE INDEX IF NOT EXISTS idx_scenes_proj ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_chap ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_entities_proj ON entities(project_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_canon_rules_entity ON canon_rules(entity_id);
CREATE INDEX IF NOT EXISTS idx_character_changes_entity ON character_changes(entity_id);
CREATE INDEX IF NOT EXISTS idx_character_changes_event ON character_changes(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON continuity_reports(project_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON continuity_reports(affected_entity_id);
CREATE INDEX IF NOT EXISTS idx_story_threads_proj ON story_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_thread_chapters_thread ON thread_chapters(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_chapters_chapter ON thread_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_story_insights_proj ON story_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_writer_decisions_proj ON writer_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_chapter_history_ch ON chapter_history(chapter_id);
CREATE INDEX IF NOT EXISTS idx_history_date ON chapter_history(created_at);
CREATE INDEX IF NOT EXISTS idx_chapter_links_proj ON chapter_links(project_id);
CREATE INDEX IF NOT EXISTS idx_chapter_links_source ON chapter_links(source_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_links_target ON chapter_links(target_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_ch ON chapter_versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_story_snapshots_proj ON story_snapshots(project_id);
