-- =====================================================
-- Casino Tracker - COMPLETE Supabase Database Schema
-- =====================================================
-- This script creates ALL necessary tables for the Casino Tracker app
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BACKUPS TABLE
-- Stores complete app backups with all data
-- =====================================================
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  version TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON backups(timestamp DESC);

ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON backups;
CREATE POLICY "Enable all operations for all users" ON backups
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. USERS TABLE
-- Stores user accounts and authentication info
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON users;
CREATE POLICY "Enable all operations for all users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. GAMBLING SESSIONS TABLE
-- Stores casino gambling sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS gambling_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  casino_name TEXT NOT NULL,
  state TEXT NOT NULL,
  game_type TEXT,
  start_amount NUMERIC(10, 2) NOT NULL,
  is_free_bet BOOLEAN DEFAULT false,
  add_on_amount NUMERIC(10, 2) DEFAULT 0,
  add_on_category TEXT,
  borrow_from TEXT,
  end_amount NUMERIC(10, 2),
  total_investment NUMERIC(10, 2) NOT NULL,
  win_loss NUMERIC(10, 2),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gambling_sessions_user_id ON gambling_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gambling_sessions_start_time ON gambling_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_gambling_sessions_is_active ON gambling_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_gambling_sessions_casino_name ON gambling_sessions(casino_name);
CREATE INDEX IF NOT EXISTS idx_gambling_sessions_state ON gambling_sessions(state);

ALTER TABLE gambling_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON gambling_sessions;
CREATE POLICY "Enable all operations for all users" ON gambling_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. LOANS TABLE
-- Stores money lent to others
-- =====================================================
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  original_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  loan_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_loan_date ON loans(loan_date DESC);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_name ON loans(borrower_name);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON loans;
CREATE POLICY "Enable all operations for all users" ON loans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. LOAN PAYMENTS TABLE
-- Stores payments made towards loans
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_payments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON loan_payments(date DESC);

ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON loan_payments;
CREATE POLICY "Enable all operations for all users" ON loan_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. LOAN ADDITIONS TABLE
-- ** MISSING FROM PREVIOUS SCHEMA **
-- Stores additional amounts added to existing loans
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_additions (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_additions_loan_id ON loan_additions(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_additions_date ON loan_additions(date DESC);

ALTER TABLE loan_additions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON loan_additions;
CREATE POLICY "Enable all operations for all users" ON loan_additions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. BORROWS TABLE
-- Stores money borrowed from others
-- =====================================================
CREATE TABLE IF NOT EXISTS borrows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  borrow_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  session_id TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrows_user_id ON borrows(user_id);
CREATE INDEX IF NOT EXISTS idx_borrows_borrow_date ON borrows(borrow_date DESC);
CREATE INDEX IF NOT EXISTS idx_borrows_lender_name ON borrows(lender_name);
CREATE INDEX IF NOT EXISTS idx_borrows_session_id ON borrows(session_id);

ALTER TABLE borrows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON borrows;
CREATE POLICY "Enable all operations for all users" ON borrows
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 8. BORROW PAYMENTS TABLE
-- Stores payments made towards borrowed money
-- =====================================================
CREATE TABLE IF NOT EXISTS borrow_payments (
  id TEXT PRIMARY KEY,
  borrow_id TEXT NOT NULL REFERENCES borrows(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrow_payments_borrow_id ON borrow_payments(borrow_id);
CREATE INDEX IF NOT EXISTS idx_borrow_payments_date ON borrow_payments(date DESC);

ALTER TABLE borrow_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON borrow_payments;
CREATE POLICY "Enable all operations for all users" ON borrow_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 9. BETS TABLE
-- Stores personal bets with opponents
-- =====================================================
CREATE TABLE IF NOT EXISTS bets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  opponent TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  won BOOLEAN NOT NULL,
  bet_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_bet_date ON bets(bet_date DESC);
CREATE INDEX IF NOT EXISTS idx_bets_opponent ON bets(opponent);
CREATE INDEX IF NOT EXISTS idx_bets_won ON bets(won);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON bets;
CREATE POLICY "Enable all operations for all users" ON bets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 10. SPORTS BETS TABLE
-- Stores sports betting records
-- =====================================================
CREATE TABLE IF NOT EXISTS sports_bets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  teams TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  odds NUMERIC(10, 2),
  payout NUMERIC(10, 2),
  won BOOLEAN,
  bet_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_bet_date ON sports_bets(bet_date DESC);
CREATE INDEX IF NOT EXISTS idx_sports_bets_sport ON sports_bets(sport);
CREATE INDEX IF NOT EXISTS idx_sports_bets_won ON sports_bets(won);

ALTER TABLE sports_bets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON sports_bets;
CREATE POLICY "Enable all operations for all users" ON sports_bets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 11. EXPENSES TABLE
-- Stores general expenses
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  merchant TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  notes TEXT,
  expense_type TEXT DEFAULT 'standard',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_merchant ON expenses(merchant);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON expenses;
CREATE POLICY "Enable all operations for all users" ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 12. RECURRING BILLS TABLE
-- Stores monthly recurring bills
-- =====================================================
CREATE TABLE IF NOT EXISTS recurring_bills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_processed_month TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_bills_user_id ON recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_due_day ON recurring_bills(due_day);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_is_active ON recurring_bills(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_category ON recurring_bills(category);

ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON recurring_bills;
CREATE POLICY "Enable all operations for all users" ON recurring_bills
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 13. MONTHLY UTILITIES TABLE
-- Stores utility bills by month
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_utilities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  electric NUMERIC(10, 2) DEFAULT 0,
  natural_gas NUMERIC(10, 2) DEFAULT 0,
  water NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_monthly_utilities_user_id ON monthly_utilities(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_utilities_month_key ON monthly_utilities(month_key DESC);

ALTER TABLE monthly_utilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON monthly_utilities;
CREATE POLICY "Enable all operations for all users" ON monthly_utilities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 14. APP SETTINGS TABLE
-- Stores app-level settings and preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  last_casino_state TEXT,
  last_casino_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON app_settings;
CREATE POLICY "Enable all operations for all users" ON app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CREATE TRIGGERS FOR updated_at COLUMNS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_backups_updated_at ON backups;
CREATE TRIGGER update_backups_updated_at BEFORE UPDATE ON backups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gambling_sessions_updated_at ON gambling_sessions;
CREATE TRIGGER update_gambling_sessions_updated_at BEFORE UPDATE ON gambling_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_borrows_updated_at ON borrows;
CREATE TRIGGER update_borrows_updated_at BEFORE UPDATE ON borrows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bets_updated_at ON bets;
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sports_bets_updated_at ON sports_bets;
CREATE TRIGGER update_sports_bets_updated_at BEFORE UPDATE ON sports_bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_bills_updated_at ON recurring_bills;
CREATE TRIGGER update_recurring_bills_updated_at BEFORE UPDATE ON recurring_bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_utilities_updated_at ON monthly_utilities;
CREATE TRIGGER update_monthly_utilities_updated_at BEFORE UPDATE ON monthly_utilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUMMARY VIEWS
-- =====================================================

-- View for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(DISTINCT gs.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN gs.is_active = false THEN gs.id END) as completed_sessions,
  COALESCE(SUM(CASE WHEN gs.is_active = false THEN gs.win_loss ELSE 0 END), 0) as total_winloss,
  COUNT(DISTINCT l.id) as total_loans,
  COALESCE(SUM(l.amount - l.amount_paid), 0) as total_loans_outstanding,
  COUNT(DISTINCT b.id) as total_borrows,
  COALESCE(SUM(b.amount - b.amount_paid), 0) as total_borrows_outstanding,
  COUNT(DISTINCT bet.id) as total_bets,
  COUNT(DISTINCT sb.id) as total_sports_bets,
  COUNT(DISTINCT e.id) as total_expenses,
  COALESCE(SUM(e.amount), 0) as total_expenses_amount
FROM users u
LEFT JOIN gambling_sessions gs ON u.id = gs.user_id
LEFT JOIN loans l ON u.id = l.user_id
LEFT JOIN borrows b ON u.id = b.user_id
LEFT JOIN bets bet ON u.id = bet.user_id
LEFT JOIN sports_bets sb ON u.id = sb.user_id
LEFT JOIN expenses e ON u.id = e.user_id
GROUP BY u.id, u.username;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Casino Tracker database schema created successfully!';
  RAISE NOTICE '📊 Created 14 tables (including loan_additions) with proper indexes and RLS policies';
  RAISE NOTICE '🔒 All tables have Row Level Security enabled';
  RAISE NOTICE '⚡ Triggers for updated_at columns are active';
  RAISE NOTICE '📈 Summary views created for statistics';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   1. backups';
  RAISE NOTICE '   2. users';
  RAISE NOTICE '   3. gambling_sessions';
  RAISE NOTICE '   4. loans';
  RAISE NOTICE '   5. loan_payments';
  RAISE NOTICE '   6. loan_additions (⭐ ADDED)';
  RAISE NOTICE '   7. borrows';
  RAISE NOTICE '   8. borrow_payments';
  RAISE NOTICE '   9. bets';
  RAISE NOTICE '   10. sports_bets';
  RAISE NOTICE '   11. expenses';
  RAISE NOTICE '   12. recurring_bills';
  RAISE NOTICE '   13. monthly_utilities';
  RAISE NOTICE '   14. app_settings';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Your database is ready to use!';
END $$;
