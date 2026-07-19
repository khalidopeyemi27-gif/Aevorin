export interface HealthIssue {
  type: 'outline' | 'memory';
  message: string;
  severity: 'warning' | 'info';
  targetId?: string;
  targetType?: 'chapter' | 'scene' | 'character';
}

export interface StoryHealth {
  stable: boolean;
  outlineIssues: HealthIssue[];
  memoryIssues: HealthIssue[];
}
