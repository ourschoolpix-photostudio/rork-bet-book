-- =====================================================
-- Vehicle Expense Tracking - Supabase Database Schema
-- =====================================================
-- This script creates tables for vehicle expense tracking
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. VEHICLES TABLE
-- Stores vehicle information for tracking expenses
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  color TEXT,
  license_plate TEXT,
  starting_mileage INTEGER NOT NULL CHECK (starting_mileage >= 0),
  current_mileage INTEGER NOT NULL CHECK (current_mileage >= 0),
  year_start_mileage INTEGER CHECK (year_start_mileage >= 0),
  year_ending_mileage INTEGER CHECK (year_ending_mileage >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON vehicles;
CREATE POLICY "Enable all operations for all users" ON vehicles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. VEHICLE EXPENSES TABLE
-- Stores expenses related to vehicles
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Gas', 'Auto Repair', 'Maintenance', 'Insurance', 'Registration', 'Car Wash', 'Parking')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  merchant TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  mileage INTEGER CHECK (mileage >= 0),
  gallons NUMERIC(10, 3) CHECK (gallons >= 0),
  price_per_gallon NUMERIC(10, 3) CHECK (price_per_gallon >= 0),
  notes TEXT,
  receipt_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_user_id ON vehicle_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle_id ON vehicle_expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON vehicle_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_category ON vehicle_expenses(category);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_created_at ON vehicle_expenses(created_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE vehicle_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for all users" ON vehicle_expenses;
CREATE POLICY "Enable all operations for all users" ON vehicle_expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CREATE TRIGGERS FOR updated_at COLUMNS
-- =====================================================

-- Create trigger for vehicles table
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for vehicle_expenses table
DROP TRIGGER IF EXISTS update_vehicle_expenses_updated_at ON vehicle_expenses;
CREATE TRIGGER update_vehicle_expenses_updated_at BEFORE UPDATE ON vehicle_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTOMATIC MILEAGE UPDATE TRIGGER
-- Updates vehicle's current_mileage when expense with mileage is added
-- =====================================================

-- Function to update vehicle mileage
CREATE OR REPLACE FUNCTION update_vehicle_mileage()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new expense has a mileage value
  IF NEW.mileage IS NOT NULL THEN
    -- Update the vehicle's current_mileage if the new mileage is greater
    UPDATE vehicles
    SET current_mileage = GREATEST(current_mileage, NEW.mileage)
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic mileage update on insert
DROP TRIGGER IF EXISTS update_mileage_on_insert ON vehicle_expenses;
CREATE TRIGGER update_mileage_on_insert 
  AFTER INSERT ON vehicle_expenses
  FOR EACH ROW 
  EXECUTE FUNCTION update_vehicle_mileage();

-- Create trigger for automatic mileage update on update
DROP TRIGGER IF EXISTS update_mileage_on_update ON vehicle_expenses;
CREATE TRIGGER update_mileage_on_update 
  AFTER UPDATE ON vehicle_expenses
  FOR EACH ROW 
  WHEN (OLD.mileage IS DISTINCT FROM NEW.mileage)
  EXECUTE FUNCTION update_vehicle_mileage();

-- =====================================================
-- USEFUL VIEWS FOR VEHICLE TRACKING
-- =====================================================

-- View for vehicle expense summaries
CREATE OR REPLACE VIEW vehicle_expense_summary AS
SELECT 
  v.id as vehicle_id,
  v.user_id,
  v.name as vehicle_name,
  v.year,
  v.make,
  v.model,
  v.current_mileage,
  v.year_start_mileage,
  v.year_ending_mileage,
  COALESCE(v.year_ending_mileage, v.current_mileage) - COALESCE(v.year_start_mileage, v.starting_mileage) as year_miles_driven,
  COUNT(ve.id) as total_expenses,
  COALESCE(SUM(ve.amount), 0) as total_expense_amount,
  COALESCE(SUM(CASE WHEN ve.category = 'Gas' THEN ve.amount ELSE 0 END), 0) as gas_expenses,
  COALESCE(SUM(CASE WHEN ve.category = 'Auto Repair' THEN ve.amount ELSE 0 END), 0) as repair_expenses,
  COALESCE(SUM(CASE WHEN ve.category = 'Maintenance' THEN ve.amount ELSE 0 END), 0) as maintenance_expenses,
  COALESCE(SUM(CASE WHEN ve.category = 'Insurance' THEN ve.amount ELSE 0 END), 0) as insurance_expenses,
  COALESCE(SUM(ve.gallons), 0) as total_gallons,
  CASE 
    WHEN SUM(ve.gallons) > 0 
    THEN SUM(ve.amount) / NULLIF(SUM(ve.gallons), 0)
    ELSE 0 
  END as avg_price_per_gallon
FROM vehicles v
LEFT JOIN vehicle_expenses ve ON v.id = ve.vehicle_id
WHERE v.is_active = true
GROUP BY v.id, v.user_id, v.name, v.year, v.make, v.model, v.current_mileage, v.year_start_mileage;

-- View for recent vehicle expenses
CREATE OR REPLACE VIEW recent_vehicle_expenses AS
SELECT 
  ve.*,
  v.name as vehicle_name,
  v.year as vehicle_year,
  v.make as vehicle_make,
  v.model as vehicle_model
FROM vehicle_expenses ve
JOIN vehicles v ON ve.vehicle_id = v.id
WHERE v.is_active = true
ORDER BY ve.date DESC, ve.created_at DESC
LIMIT 100;

-- View for gas fill-up statistics
CREATE OR REPLACE VIEW gas_fillup_stats AS
SELECT 
  v.id as vehicle_id,
  v.user_id,
  v.name as vehicle_name,
  COUNT(ve.id) as total_fillups,
  COALESCE(SUM(ve.gallons), 0) as total_gallons,
  COALESCE(SUM(ve.amount), 0) as total_gas_cost,
  COALESCE(AVG(ve.price_per_gallon), 0) as avg_price_per_gallon,
  COALESCE(AVG(ve.gallons), 0) as avg_gallons_per_fillup,
  COALESCE(AVG(ve.amount), 0) as avg_cost_per_fillup,
  MAX(ve.date) as last_fillup_date
FROM vehicles v
LEFT JOIN vehicle_expenses ve ON v.id = ve.vehicle_id AND ve.category = 'Gas'
WHERE v.is_active = true
GROUP BY v.id, v.user_id, v.name;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Vehicle expense tracking schema created successfully!';
  RAISE NOTICE '📊 Created 2 tables with proper indexes and RLS policies';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '⚡ Triggers for updated_at and automatic mileage updates are active';
  RAISE NOTICE '📈 Created 3 summary views for statistics and reporting';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   1. vehicles - Store vehicle information';
  RAISE NOTICE '   2. vehicle_expenses - Store vehicle-related expenses';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Views created:';
  RAISE NOTICE '   1. vehicle_expense_summary - Comprehensive vehicle expense summaries';
  RAISE NOTICE '   2. recent_vehicle_expenses - Last 100 vehicle expenses with vehicle details';
  RAISE NOTICE '   3. gas_fillup_stats - Gas fill-up statistics per vehicle';
  RAISE NOTICE '';
  RAISE NOTICE '🚗 Features:';
  RAISE NOTICE '   • Automatic mileage tracking based on expense entries';
  RAISE NOTICE '   • Track multiple vehicles per user';
  RAISE NOTICE '   • Support for 7 expense categories (Gas, Repair, Maintenance, etc.)';
  RAISE NOTICE '   • Detailed gas tracking with gallons and price per gallon';
  RAISE NOTICE '   • Year-to-date mileage tracking with year ending mileage support';
  RAISE NOTICE '   • Cascade delete - removing vehicle removes all its expenses';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Your vehicle expense tracking is ready to use!';
END $$;
