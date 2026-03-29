import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

interface BackupData {
  id: string;
  version: string;
  timestamp: string;
  data: Record<string, string | null>;
  createdAt: string;
}

const backupsStore = new Map<string, BackupData>();

export const createBackupProcedure = publicProcedure
  .input(z.object({
    version: z.string(),
    timestamp: z.string(),
    data: z.record(z.string(), z.string().nullable()),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('🔵 CREATE BACKUP - Received request');
      console.log('🔵 Backup timestamp:', input.timestamp);
      console.log('🔵 Data keys:', Object.keys(input.data));
      
      const backupId = `backup-${Date.now()}`;
      
      const backupData: BackupData = {
        id: backupId,
        version: input.version,
        timestamp: input.timestamp,
        data: input.data,
        createdAt: new Date().toISOString(),
      };
      
      backupsStore.set(backupId, backupData);
      console.log('✅ Backup saved to memory store:', backupId);
      console.log('📊 Total backups in store:', backupsStore.size);
      
      return {
        success: true,
        backupId,
        timestamp: input.timestamp,
      };
    } catch (error) {
      console.error('❌ CREATE BACKUP ERROR:', error);
      throw error;
    }
  });

export { backupsStore };
