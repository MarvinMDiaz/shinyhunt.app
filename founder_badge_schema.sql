-- Founder Badge Schema Support
-- Run this SQL in Supabase SQL Editor to ensure all required columns exist

-- Add signup_number column if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_number INTEGER;

-- Add badges column if missing (should already exist as JSONB)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Add has_seen_first_151_popup column if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_first_151_popup BOOLEAN DEFAULT false;

-- Create index for faster queries on signup_number
CREATE INDEX IF NOT EXISTS profiles_signup_number_idx ON public.profiles(signup_number);

-- Verify columns exist
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY ordinal_position;
