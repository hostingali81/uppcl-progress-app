-- Migration: Add additional columns to works table for detailed project metadata
-- Date: 2025-10-27

BEGIN;

ALTER TABLE public.works
  -- Civil hierarchy
  ADD COLUMN IF NOT EXISTS civil_zone text,
  ADD COLUMN IF NOT EXISTS civil_circle text,
  ADD COLUMN IF NOT EXISTS civil_division text,
  ADD COLUMN IF NOT EXISTS civil_sub_division text,

  -- Administrative / assignment
  ADD COLUMN IF NOT EXISTS distribution_zone text,
  ADD COLUMN IF NOT EXISTS distribution_circle text,
  ADD COLUMN IF NOT EXISTS distribution_division text,
  ADD COLUMN IF NOT EXISTS distribution_sub_division text,

  -- JE and site
  ADD COLUMN IF NOT EXISTS je_name text,
  ADD COLUMN IF NOT EXISTS site_name text,

  -- Work and financial fields
  ADD COLUMN IF NOT EXISTS work_category text,
  ADD COLUMN IF NOT EXISTS work_name text,
  ADD COLUMN IF NOT EXISTS sanction_amount_lacs numeric(14,2),
  ADD COLUMN IF NOT EXISTS tender_no text,
  ADD COLUMN IF NOT EXISTS boq_amount numeric(14,2),

  -- Tender / NIT / LOI / Agreement fields
  ADD COLUMN IF NOT EXISTS nit_date date,
  ADD COLUMN IF NOT EXISTS part1_opening_date date,
  ADD COLUMN IF NOT EXISTS part2_opening_date date,
  ADD COLUMN IF NOT EXISTS loi_no_and_date text,
  ADD COLUMN IF NOT EXISTS rate_as_per_ag numeric(8,3),
  ADD COLUMN IF NOT EXISTS agreement_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS agreement_no_and_date text,

  -- Firm / contractor
  ADD COLUMN IF NOT EXISTS firm_name_and_contact text,
  ADD COLUMN IF NOT EXISTS firm_contact_no text,
  ADD COLUMN IF NOT_EXISTS firm_email text,

  -- Dates & progress
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS scheduled_completion_date date,
  ADD COLUMN IF NOT EXISTS weightage numeric(6,2),
  ADD COLUMN IF NOT EXISTS progress_percentage integer,
  ADD COLUMN IF NOT EXISTS remark text,
  ADD COLUMN IF NOT_EXISTS wbs_code text,

  -- Status fields
  ADD COLUMN IF NOT_EXISTS mb_status text,
  ADD COLUMN IF NOT_EXISTS teco text,
  ADD COLUMN IF NOT_EXISTS fico text;

-- Add comments to clarify columns
COMMENT ON COLUMN public.works.civil_zone IS 'Civil Zone (from project scope)';
COMMENT ON COLUMN public.works.civil_circle IS 'Civil Circle (from project scope)';
COMMENT ON COLUMN public.works.civil_division IS 'Civil Division (from project scope)';
COMMENT ON COLUMN public.works.civil_sub_division IS 'Civil Sub-Division (from project scope)';

COMMENT ON COLUMN public.works.sanction_amount_lacs IS 'Sanctioned Amount in Lacs';
COMMENT ON COLUMN public.works.boq_amount IS 'BOQ Amount';
COMMENT ON COLUMN public.works.agreement_amount IS 'Agreement Amount';

COMMIT;

-- NOTE: This migration only adds columns; consider backfill and splitting/normalizing combined text fields (loi_no_and_date, agreement_no_and_date) in a follow-up migration.
