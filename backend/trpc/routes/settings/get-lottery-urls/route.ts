import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

const getLotteryUrlsSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseKey: z.string().min(1),
});

export const getLotteryUrlsProcedure = protectedProcedure
  .input(getLotteryUrlsSchema)
  .query(async ({ input }) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { supabaseUrl, supabaseKey } = input;
      const userId = 'default-user';

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('lottery_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching lottery settings:', error);
        throw new Error(`Failed to fetch settings: ${error.message}`);
      }

      if (!data) {
        return {
          success: true,
          settings: null,
        };
      }

      return {
        success: true,
        settings: {
          powerballUrl: data.powerball_url,
          megaMillionsUrl: data.mega_millions_url,
          updatedAt: data.updated_at,
        },
      };
    } catch (error) {
      console.error('❌ Error in getLotteryUrlsProcedure:', error);
      throw error;
    }
  });
