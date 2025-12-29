# Schedule Data Column Migration

## Problem
The `schedule_data` column is missing from the `works` table in Supabase.

## Solution
Run the migration file: `add_schedule_data_column.sql`

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `db/migrations/add_schedule_data_column.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
supabase db push
```

## Migration SQL
```sql
ALTER TABLE public.works 
ADD COLUMN IF NOT EXISTS schedule_data TEXT NULL;

COMMENT ON COLUMN public.works.schedule_data IS 'Stores Gantt chart schedule data as JSON string';
```

## Verification
After running the migration, verify the column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'works' AND column_name = 'schedule_data';
```

## What This Fixes
- Allows saving Gantt chart schedule data
- Fixes the error: "Could not find the 'schedule_data' column of 'works' in the schema cache"
