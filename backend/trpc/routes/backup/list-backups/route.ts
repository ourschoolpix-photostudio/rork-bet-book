import { publicProcedure } from "@/backend/trpc/create-context";
import { backupsStore } from './create-backup/route';

export const listBackupsProcedure = publicProcedure.query(async () => {
  console.log('Listing backups from server');
  console.log('Total backups in store:', backupsStore.size);
  
  const backups = Array.from(backupsStore.values()).map(backup => ({
    id: backup.id,
    timestamp: backup.timestamp,
    createdAt: backup.createdAt,
  }));
  
  backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  console.log('Returning', backups.length, 'backups');
  
  return { backups };
});
