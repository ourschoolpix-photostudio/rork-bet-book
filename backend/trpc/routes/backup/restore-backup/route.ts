import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { backupsStore } from './create-backup/route';

export const restoreBackupProcedure = publicProcedure
  .input(z.object({
    backupId: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('Restoring backup on server:', input.backupId);
    
    const backupData = backupsStore.get(input.backupId);
    
    if (!backupData) {
      console.error('Backup not found:', input.backupId);
      console.log('Available backups:', Array.from(backupsStore.keys()));
      throw new Error('Backup not found');
    }
    
    console.log('Backup retrieved successfully:', input.backupId);
    
    return {
      success: true,
      message: 'Backup retrieved successfully',
      data: backupData,
    };
  });
