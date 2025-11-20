import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { createClient } from '@supabase/supabase-js';

const saveLotteryUrlsSchema = z.object({
  powerballUrl: z.string().url(),
  megaMillionsUrl: z.string().url(),
  supabaseUrl: z.string().url(),
  supabaseKey: z.string().min(1),
});

export const saveLotteryUrlsProcedure = protectedProcedure
  .input(saveLotteryUrlsSchema)
  .mutation(async ({ input }) => {
    try {
      const { powerballUrl, megaMillionsUrl, supabaseUrl, supabaseKey } = input;
      const userId = 'default-user';

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: existingSettings, error: fetchError } = await supabase
        .from('lottery_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching lottery settings:', fetchError);
        throw new Error(`Failed to fetch settings: ${fetchError.message}`);
      }

      const settingsData = {
        user_id: userId,
        powerball_url: powerballUrl,
        mega_millions_url: megaMillionsUrl,
        updated_at: new Date().toISOString(),
      };

      if (existingSettings) {
        const { error: updateError } = await supabase
          .from('lottery_settings')
          .update(settingsData)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating lottery settings:', updateError);
          throw new Error(`Failed to update settings: ${updateError.message}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('lottery_settings')
          .insert({
            ...settingsData,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting lottery settings:', insertError);
          throw new Error(`Failed to save settings: ${insertError.message}`);
        }
      }

      console.log('✅ Lottery URLs saved to Supabase');
      return {
        success: true,
        message: 'Lottery URLs saved successfully',
      };
    } catch (error) {
      console.error('❌ Error in saveLotteryUrlsProcedure:', error);
      throw error;
    }
  });
