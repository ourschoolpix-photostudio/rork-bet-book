import { publicProcedure } from '@/backend/trpc/create-context';

interface PowerballResponse {
  numbers: number[];
  powerball: number;
  drawDate: string;
  jackpot: string;
}

export const getPowerballProcedure = publicProcedure.query(async (): Promise<PowerballResponse> => {
  try {
    console.log('Fetching Powerball data from NY State API...');
    
    const response = await fetch('https://data.ny.gov/resource/d6yy-54nr.json?$order=draw_date%20DESC&$limit=1');
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Powerball API response received:', data);
    
    if (!data || !data[0]) {
      throw new Error('No data received from API');
    }
    
    const latest = data[0];
    const winningNumbersArr = latest.winning_numbers.split(' ');
    
    const numbers = [
      parseInt(winningNumbersArr[0]),
      parseInt(winningNumbersArr[1]),
      parseInt(winningNumbersArr[2]),
      parseInt(winningNumbersArr[3]),
      parseInt(winningNumbersArr[4]),
    ].sort((a: number, b: number) => a - b);
    
    const powerball = parseInt(winningNumbersArr[5]);
    const drawDate = latest.draw_date;
    
    let jackpot = 'TBD';
    if (latest.multiplier) {
      jackpot = `${latest.multiplier}x`;
    }
    
    console.log('Parsed Powerball data:', { numbers, powerball, drawDate, jackpot });
    
    return {
      numbers,
      powerball,
      drawDate,
      jackpot,
    };
  } catch (error) {
    console.error('Error fetching Powerball data:', error);
    throw new Error(`Failed to fetch Powerball data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
