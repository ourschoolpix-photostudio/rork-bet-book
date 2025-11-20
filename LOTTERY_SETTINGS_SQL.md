# Lottery Settings SQL Setup

## Create the lottery_settings table in Supabase

Run this SQL script in your Supabase SQL Editor to create the necessary table for storing lottery URLs:

```sql
-- Create the lottery_settings table
CREATE TABLE IF NOT EXISTS lottery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  powerball_url TEXT NOT NULL,
  mega_millions_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lottery_settings_user_id ON lottery_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE lottery_settings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for all users
-- You can customize this later based on your authentication needs
CREATE POLICY "Enable all access for lottery settings" ON lottery_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Add a comment to the table
COMMENT ON TABLE lottery_settings IS 'Stores user lottery scraping URL preferences';
```

## Verify the table was created

After running the SQL script, verify the table exists:

```sql
SELECT * FROM lottery_settings LIMIT 1;
```

## Table Structure

- **id**: UUID (Primary Key) - Auto-generated unique identifier
- **user_id**: TEXT (Unique) - User identifier (uses the user ID from your auth context)
- **powerball_url**: TEXT - URL for Powerball lottery scraping
- **mega_millions_url**: TEXT - URL for Mega Millions lottery scraping
- **created_at**: TIMESTAMP - When the record was created
- **updated_at**: TIMESTAMP - When the record was last updated

## How it works

1. When a user saves lottery URLs in the app, they are:
   - First saved to AsyncStorage (local storage) for immediate access
   - Then synced to Supabase backend if credentials are configured

2. When the app loads and Supabase is configured:
   - Lottery URLs are automatically loaded from the backend
   - This ensures settings are synced across devices

3. The backend uses tRPC procedures:
   - `settings.saveLotteryUrls` - Saves URLs to Supabase
   - `settings.getLotteryUrls` - Retrieves URLs from Supabase

## Testing

After creating the table, test it by:

1. Going to Settings > Lottery Scraping in your app
2. Enter custom URLs for Powerball and Mega Millions
3. Click "Save URLs"
4. Check your Supabase dashboard > Table Editor > lottery_settings
5. You should see a new row with your saved URLs

## Optional: Secure with Authentication

If you want to restrict settings to specific authenticated users:

```sql
-- Drop the permissive policy
DROP POLICY "Enable all access for lottery settings" ON lottery_settings;

-- Create user-specific policies (requires authentication)
CREATE POLICY "Users can manage their own lottery settings" ON lottery_settings
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```
