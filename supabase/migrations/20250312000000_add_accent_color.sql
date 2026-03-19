-- Add accent_color column to profiles for user-customizable outline/border highlight color
-- Run this in Supabase SQL Editor if save fails with "column does not exist"

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS accent_color TEXT;

COMMENT ON COLUMN public.profiles.accent_color IS 'User-selected hex color for progress bar and outline highlights (e.g. #22c55e). Valid hex only.';
