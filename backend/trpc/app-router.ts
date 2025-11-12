import { createTRPCRouter } from "@/backend/trpc/create-context";
import { hiProcedure } from "@/backend/trpc/routes/example/hi/route";
import { createBackupProcedure } from "@/backend/trpc/routes/backup/create-backup/route";
import { restoreBackupProcedure } from "@/backend/trpc/routes/backup/restore-backup/route";
import { listBackupsProcedure } from "@/backend/trpc/routes/backup/list-backups/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  backup: createTRPCRouter({
    create: createBackupProcedure,
    restore: restoreBackupProcedure,
    list: listBackupsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
