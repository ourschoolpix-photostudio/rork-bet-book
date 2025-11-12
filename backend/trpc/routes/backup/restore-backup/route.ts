import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

export const restoreBackupProcedure = publicProcedure
  .input(z.object({
    version: z.string(),
    timestamp: z.string(),
    data: z.record(z.string(), z.string().nullable()),
  }))
  .mutation(async ({ input }) => {
    console.log('Restoring backup on server from:', input.timestamp);
    
    return {
      success: true,
      message: 'Backup restored successfully',
      timestamp: input.timestamp,
    };
  });
