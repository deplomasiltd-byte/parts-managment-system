#!/bin/bash

# Apply the currency field migration to expenses table
echo "Applying migration: add_currency_to_expenses.sql"

# Extract the database URL from .env
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"')

# Run the migration against the database
psql "$DATABASE_URL" -f migrations/add_currency_to_expenses.sql

echo "Migration applied successfully!"

# Verify the changes
echo "Verifying the changes..."
psql "$DATABASE_URL" -c "\d expenses"