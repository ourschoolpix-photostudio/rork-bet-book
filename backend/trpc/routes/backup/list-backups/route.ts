import { publicProcedure } from "@/backend/trpc/create-context";

export const listBackupsProcedure = publicProcedure.query(async () => {
  console.log('Listing backups from server');
  
  return {
    backups: [],
  };
});
