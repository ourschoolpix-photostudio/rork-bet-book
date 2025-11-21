import { createTRPCRouter } from "@/backend/trpc/create-context";
import { hiProcedure } from "@/backend/trpc/routes/example/hi/route";
import { createBackupProcedure } from "@/backend/trpc/routes/backup/create-backup/route";
import { restoreBackupProcedure } from "@/backend/trpc/routes/backup/restore-backup/route";
import { listBackupsProcedure } from "@/backend/trpc/routes/backup/list-backups/route";
import { saveLotteryUrlsProcedure } from "@/backend/trpc/routes/settings/save-lottery-urls/route";
import { getLotteryUrlsProcedure } from "@/backend/trpc/routes/settings/get-lottery-urls/route";
import { getMegaMillionsProcedure } from "@/backend/trpc/routes/lottery/get-mega-millions/route";
import { getPowerballProcedure } from "@/backend/trpc/routes/lottery/get-powerball/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  backup: createTRPCRouter({
    create: createBackupProcedure,
    restore: restoreBackupProcedure,
    list: listBackupsProcedure,
  }),
  settings: createTRPCRouter({
    saveLotteryUrls: saveLotteryUrlsProcedure,
    getLotteryUrls: getLotteryUrlsProcedure,
  }),
  lottery: createTRPCRouter({
    getMegaMillions: getMegaMillionsProcedure,
    getPowerball: getPowerballProcedure,
  }),
});

export type AppRouter = typeof appRouter;
