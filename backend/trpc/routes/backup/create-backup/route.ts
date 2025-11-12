import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

const BACKUPS_DIR = path.join(process.cwd(), '.backups');

async function ensureBackupsDir() {
  try {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating backups directory:', error);
  }
}

export const createBackupProcedure = publicProcedure
  .input(z.object({
    version: z.string(),
    timestamp: z.string(),
    data: z.record(z.string(), z.string().nullable()),
  }))
  .mutation(async ({ input }) => {
    console.log('Creating backup on server:', input.timestamp);
    
    await ensureBackupsDir();
    
    const backupId = `backup-${Date.now()}`;
    const fileName = `${backupId}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);
    
    const backupData = {
      id: backupId,
      version: input.version,
      timestamp: input.timestamp,
      data: input.data,
      createdAt: new Date().toISOString(),
    };
    
    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log('Backup saved to:', filePath);
    
    return {
      success: true,
      backupId,
      timestamp: input.timestamp,
    };
  });
