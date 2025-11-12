import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

const BACKUPS_DIR = path.join(process.cwd(), '.backups');

export const restoreBackupProcedure = publicProcedure
  .input(z.object({
    backupId: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('Restoring backup on server:', input.backupId);
    
    const filePath = path.join(BACKUPS_DIR, `${input.backupId}.json`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const backupData = JSON.parse(content);
      
      return {
        success: true,
        message: 'Backup retrieved successfully',
        data: backupData,
      };
    } catch (error) {
      console.error('Error reading backup:', error);
      throw new Error('Backup not found or could not be read');
    }
  });
