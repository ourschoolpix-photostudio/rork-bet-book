import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export const createBackupProcedure = publicProcedure
  .input(z.object({
    version: z.string(),
    timestamp: z.string(),
    data: z.record(z.string(), z.string().nullable()),
  }))
  .mutation(async ({ input }) => {
    console.log('Creating backup on server:', input.timestamp);
    
    return {
      success: true,
      backup: input,
      backupId: `backup-${Date.now()}`,
    };
  });
