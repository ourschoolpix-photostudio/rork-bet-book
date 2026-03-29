

export interface BackupRecord {
  id: string;
  user_id?: string;
  version: string;
  timestamp: string;
  data: Record<string, string | null>;
  created_at: string;
}
