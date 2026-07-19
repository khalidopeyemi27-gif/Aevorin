export interface TimelineEventChange {
  entity: string;
  field: string;
  old: string | number;
  new: string | number;
}

export interface TimelineEvent {
  id: string;
  type: 'character' | 'relationship' | 'chapter';
  date: string;
  chapter_id?: string;
  scene_id?: string;
  title: string;
  description?: string;
  changes?: TimelineEventChange[];
}
