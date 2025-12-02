-- Migration to add currency field to expenses table
-- Created: 2025-11-30

-- Add currency column to existing expenses table
ALTER TABLE expenses ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Create index for currency column for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);

-- Update existing records to have a default currency if needed
-- (This is just a safety measure, the DEFAULT clause should handle it)