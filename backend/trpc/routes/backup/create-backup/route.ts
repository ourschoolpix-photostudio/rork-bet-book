import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const backupDataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.record(z.string().nullable()),
});

export type BackupData = z.infer<typeof backupDataSchema>;

export const createBackupProcedure = publicProcedure
  .input(backupDataSchema)
  .mutation(async ({ input }) => {
    console.log('Creating backup on server:', input.timestamp);
    
    return {
      success: true,
      backup: input,
      backupId: `backup-${Date.now()}`,
    };
  });
