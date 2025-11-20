# Lottery Settings Backend Setup - Complete Guide

## Overview

The lottery URLs feature has been enhanced to save settings to your Supabase backend. This allows:
- Persistent storage of lottery URLs across devices
- Automatic sync when Supabase credentials are configured
- Local fallback when offline or Supabase is not configured

## 1. Create the Database Table

Run this SQL script in your **Supabase SQL Editor**:

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
CREATE POLICY "Enable all access for lottery settings" ON lottery_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Add a comment to the table
COMMENT ON TABLE lottery_settings IS 'Stores user lottery scraping URL preferences';
```

## 2. How to Run the SQL Script

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire SQL script above
5. Click **Run** or press `Cmd/Ctrl + Enter`
6. You should see a success message

## 3. Verify the Table

After running the script, verify the table was created:

```sql
SELECT * FROM lottery_settings LIMIT 1;
```

You can also check in **Table Editor** → look for the `lottery_settings` table.

## 4. Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | TEXT | User identifier (currently uses 'default-user') |
| `powerball_url` | TEXT | URL for Powerball lottery scraping |
| `mega_millions_url` | TEXT | URL for Mega Millions lottery scraping |
| `created_at` | TIMESTAMP | When the record was created |
| `updated_at` | TIMESTAMP | When the record was last updated |

## 5. How It Works

### Backend Integration

The system now includes:

1. **tRPC Procedures** (in `backend/trpc/routes/settings/`):
   - `settings.saveLotteryUrls` - Saves URLs to Supabase
   - `settings.getLotteryUrls` - Retrieves URLs from Supabase

2. **Context Integration** (in `contexts/SettingsContext.tsx`):
   - Automatically loads lottery URLs from backend when Supabase is configured
   - Saves to both local storage and backend when settings are updated
   - Falls back to local storage if backend is unavailable

### Data Flow

```
User saves lottery URLs
    ↓
Save to AsyncStorage (immediate)
    ↓
If Supabase configured → Save to backend
    ↓
Backend upserts data in lottery_settings table
```

```
App loads with Supabase configured
    ↓
Load from AsyncStorage (immediate)
    ↓
Load from backend (sync)
    ↓
Update AsyncStorage with backend data
```

## 6. Testing the Feature

### Step 1: Configure Supabase (if not already done)
1. Go to **Settings** in your app
2. Tap **Supabase Backup Settings**
3. Enter your Supabase URL and Key
4. Tap **Save & Test Connection**

### Step 2: Set Lottery URLs
1. Go to **Settings** → **Lottery Scraping**
2. Enter URLs for Powerball and Mega Millions
3. Tap **Save URLs**
4. You should see a success message

### Step 3: Verify in Supabase
1. Go to Supabase dashboard
2. Navigate to **Table Editor**
3. Open the `lottery_settings` table
4. You should see a row with:
   - `user_id`: 'default-user'
   - Your saved URLs
   - Created and updated timestamps

### Step 4: Test Sync
1. Close and reopen the app
2. Go to **Settings** → **Lottery Scraping**
3. The URLs should be automatically loaded from the backend

## 7. Console Logs

Watch for these console messages:

**When saving:**
```
✅ Lottery URLs saved to local storage
📡 Saving lottery URLs to backend...
✅ Lottery URLs saved to backend
✅ Lottery URLs saved to Supabase
```

**When loading:**
```
✅ Supabase client created with user credentials
📡 Loading lottery URLs from backend...
✅ Lottery URLs loaded from backend
```

**If errors occur:**
```
❌ Error saving to backend: [error details]
❌ Error loading lottery URLs from backend: [error details]
```

## 8. Troubleshooting

### Table creation fails
- Ensure you have proper permissions in Supabase
- Check if the table already exists (it won't recreate)
- Try running each statement separately

### URLs not saving to backend
- Check console logs for error messages
- Verify Supabase credentials are configured
- Test Supabase connection in Settings
- Check RLS policies aren't blocking access

### URLs not loading from backend
- Ensure the table has data (check Table Editor)
- Verify Supabase credentials
- Check console for error messages
- Try manually querying: `SELECT * FROM lottery_settings WHERE user_id = 'default-user';`

## 9. Optional: Secure with User Authentication

If you want to restrict settings to authenticated users in the future:

```sql
-- Drop the permissive policy
DROP POLICY "Enable all access for lottery settings" ON lottery_settings;

-- Create user-specific policies
CREATE POLICY "Users can manage their own lottery settings" ON lottery_settings
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

Then update the backend procedures to use the actual authenticated user ID instead of 'default-user'.

## 10. Benefits

✅ **Persistent Storage** - Settings are saved to the cloud  
✅ **Multi-Device Sync** - Access your URLs from any device  
✅ **Offline Support** - Falls back to local storage  
✅ **No Data Loss** - Backed up on Supabase  
✅ **Easy Recovery** - Restore settings on new devices

## Files Modified

- `backend/trpc/routes/settings/save-lottery-urls/route.ts` (new)
- `backend/trpc/routes/settings/get-lottery-urls/route.ts` (new)
- `backend/trpc/app-router.ts` (updated)
- `contexts/SettingsContext.tsx` (updated)
- `LOTTERY_SETTINGS_SQL.md` (new documentation)

## Support

If you encounter any issues:
1. Check the console logs in your app
2. Verify the SQL table was created correctly
3. Test your Supabase connection in Settings
4. Ensure you have proper Supabase credentials
