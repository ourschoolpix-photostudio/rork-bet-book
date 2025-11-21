import { publicProcedure } from '@/backend/trpc/create-context';

interface MegaMillionsResponse {
  numbers: number[];
  megaBall: number;
  drawDate: string;
  jackpot: string;
}

export const getMegaMillionsProcedure = publicProcedure.query(async (): Promise<MegaMillionsResponse> => {
  try {
    console.log('Fetching Mega Millions data from lottery API...');
    
    const response = await fetch('https://www.powerball.com/api/v1/numbers/mega-millions?_format=json');
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Mega Millions API response received:', data);
    
    if (!data || !data[0]) {
      throw new Error('No data received from API');
    }
    
    const latestDraw = data[0];
    
    const numbers = [
      parseInt(latestDraw.field_winning_numbers),
      parseInt(latestDraw.field_winning_numbers_1),
      parseInt(latestDraw.field_winning_numbers_2),
      parseInt(latestDraw.field_winning_numbers_3),
      parseInt(latestDraw.field_winning_numbers_4),
    ].sort((a: number, b: number) => a - b);
    
    const megaBall = parseInt(latestDraw.field_mega_ball);
    const drawDate = latestDraw.field_draw_date;
    
    let jackpot = 'TBD';
    if (latestDraw.field_jackpot) {
      jackpot = latestDraw.field_jackpot;
    }
    
    console.log('Parsed Mega Millions data:', { numbers, megaBall, drawDate, jackpot });
    
    return {
      numbers,
      megaBall,
      drawDate,
      jackpot,
    };
  } catch (error) {
    console.error('Error fetching Mega Millions data:', error);
    throw new Error(`Failed to fetch Mega Millions data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
