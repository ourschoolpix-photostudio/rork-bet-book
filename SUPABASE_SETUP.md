# Supabase Cloud Backup Setup Guide

## 1. Create Supabase Table

Go to your Supabase project dashboard and run this SQL query to create the backups table:

```sql
-- Create the backups table
CREATE TABLE backups (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  version TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster queries
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Optional: Create an index on user_id if you want to filter backups by user
CREATE INDEX idx_backups_user_id ON backups(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for now
-- You can customize this later based on your authentication needs
CREATE POLICY "Enable all access for all users" ON backups
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon in sidebar)
3. Click on **API** in the settings menu
4. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the `anon` key under "Project API keys")

## 3. Add Environment Variables

Create or update your `.env` file in the project root with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace the values with your actual Supabase credentials.

## 4. Restart Your App

After adding the environment variables, restart your development server:

```bash
# Stop the current server and restart
bun run start
```

## 5. Test the Backup

1. Open your app
2. Navigate to the backup section
3. Try creating a backup - choose "Cloud" when prompted
4. If successful, you should see a success message with the backup ID
5. Check your Supabase dashboard -> Table Editor -> backups table to verify the data

## Optional: Secure Your Backups with Authentication

If you want to restrict backups to specific users, update the RLS policy:

```sql
-- Drop the permissive policy
DROP POLICY "Enable all access for all users" ON backups;

-- Create user-specific policies (requires authentication)
CREATE POLICY "Users can create their own backups" ON backups
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own backups" ON backups
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own backups" ON backups
  FOR DELETE
  USING (auth.uid()::text = user_id);
```

Then update your app to set the `user_id` field when creating backups.

## Troubleshooting

### "Failed to create cloud backup"
- Check that your environment variables are set correctly
- Verify the Supabase URL is accessible
- Check the browser console or app logs for detailed error messages

### "No backups found"
- Make sure you've created at least one backup first
- Check the Supabase dashboard to verify the table has data
- Verify your RLS policies aren't blocking access

### "Supabase credentials not configured"
- Make sure you've added the environment variables to `.env`
- Restart your development server after adding the variables
