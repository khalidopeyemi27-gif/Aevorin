export interface Scene {
  id: string;
  title: string;
  goal: string;
  conflict: string;
  word_count?: number;
}

export interface CharacterRef {
  id: string;
  name: string;
  role: string;
}

export interface MemoryChangeRef {
  type: string;
  event: string;
  character: string;
  change: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  act: string;
  act_index: number;
  purpose: string;
  summary: string;
  goal: string;
  conflict: string;
  status: 'draft' | 'writing' | 'complete' | 'review';
  timeline_position: string;
  estimated_word_count: number;
  notes: string;
  order_index: number;
  emotional_target: string;
  reader_effect: string;
  theme_focus: string;
  chapter_question: string;
  turning_point: string;
  consequence: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoryDNA {
  id: string;
  project_id: string;
  theme: string;
  core_question: string;
  reader_promise: string;
  genre: string;
  tone: string;
  ending_feeling: string;
  world_rules: string;
  main_character_arc: string;
  central_conflict: string;
}

export interface ThreadChapter {
  id: string;
  thread_id: string;
  chapter_id: string;
  role: 'introduced' | 'developed' | 'changed' | 'resolved';
  chapter_title?: string;
  chapter_number?: number;
}

export interface StoryThread {
  id: string;
  project_id: string;
  name: string;
  type: 'character_arc' | 'mystery' | 'world_rule' | 'symbol' | 'relationship' | 'plot';
  created_chapter: string;
  status: 'active' | 'resolved' | 'ignored';
  description: string;
  chapters?: ThreadChapter[];
}

export interface ChapterLink {
  id: string;
  project_id: string;
  source_chapter_id: string;
  target_chapter_id: string;
  relationship: 'foreshadows' | 'continues' | 'causes' | 'contrasts' | 'references' | 'mirrors' | 'resolves' | 'introduces' | 'reveals' | 'pays_off' | 'character_arc' | 'world_building';
  strength: number;
  description: string;
  source_title?: string;
  source_number?: number;
  target_title?: string;
  target_number?: number;
}

export interface ChapterHistoryItem {
  id: string;
  chapter_id: string;
  field: string;
  old_value: string;
  new_value: string;
  change_reason: string;
  source: 'manual' | 'ai_suggestion' | 'import' | 'restore' | 'sync';
  created_at: string;
}

export interface ChapterVersion {
  id: string;
  chapter_id: string;
  snapshot_json: string;
  name: string;
  description: string;
  version_type: 'manual' | 'before_rewrite' | 'milestone' | 'auto_backup';
  created_at: string;
}

export interface StorySnapshot {
  id: string;
  project_id: string;
  snapshot_json: string;
  name: string;
  description: string;
  version_type: string;
  created_at: string;
}

export interface ChapterContext {
  chapter: Chapter;
  scenes: Scene[];
  characters: CharacterRef[];
  memoryChanges: MemoryChangeRef[];
  warnings: any[];
  history: ChapterHistoryItem[];
  links: {
    outgoing: ChapterLink[];
    incoming: ChapterLink[];
  };
  versions: ChapterVersion[];
}

export interface StoryInsight {
  id: string;
  project_id: string;
  category: 'structure' | 'characters' | 'mysteries' | 'timeline' | 'world';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  source: string;
  resolved: number;
  created_at: string;
}

export interface StoryPulseReport {
  stable: boolean;
  insights: StoryInsight[];
}
