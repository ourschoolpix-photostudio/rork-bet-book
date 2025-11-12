import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import { createBackupProcedure } from "@/backend/trpc/routes/backup/create-backup/route";
import { restoreBackupProcedure } from "@/backend/trpc/routes/backup/restore-backup/route";
import { listBackupsProcedure } from "@/backend/trpc/routes/backup/list-backups/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  backup: createTRPCRouter({
    create: createBackupProcedure,
    restore: restoreBackupProcedure,
    list: listBackupsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
