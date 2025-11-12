import { publicProcedure } from "@/backend/trpc/create-context";
import { promises as fs } from "fs";
import path from "path";

const BACKUPS_DIR = path.join(process.cwd(), '.backups');

export const listBackupsProcedure = publicProcedure.query(async () => {
  console.log('Listing backups from server');
  
  try {
    await fs.access(BACKUPS_DIR);
  } catch {
    return { backups: [] };
  }
  
  try {
    const files = await fs.readdir(BACKUPS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const backups = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(BACKUPS_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          return {
            id: data.id,
            timestamp: data.timestamp,
            createdAt: data.createdAt,
          };
        } catch (error) {
          console.error('Error reading backup file:', file, error);
          return null;
        }
      })
    );
    
    const validBackups = backups.filter(b => b !== null);
    validBackups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return { backups: validBackups };
  } catch (error) {
    console.error('Error listing backups:', error);
    return { backups: [] };
  }
});
