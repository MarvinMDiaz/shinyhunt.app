-- Add progress_color column for progress bar color only (reverts accent color scope)
-- Run in Supabase SQL Editor if color save fails with "column does not exist"
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS progress_color TEXT;

COMMENT ON COLUMN public.profiles.progress_color IS 'User-selected hex for progress bar only (e.g. #22c55e).';
