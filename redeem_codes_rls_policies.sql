-- Redeem Code System RLS Policies
-- Run this SQL in your Supabase SQL Editor to enable redeem code functionality

-- ============================================
-- 1. Create redeem_codes table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.redeem_codes (
  code TEXT PRIMARY KEY,
  badge_type TEXT NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create redeemed_codes table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.redeemed_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, code)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_redeemed_codes_user_id ON public.redeemed_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_codes_code ON public.redeemed_codes(code);

-- ============================================
-- 3. RLS Policies for redeem_codes table
-- ============================================
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read redeem codes (to check if code exists)
CREATE POLICY "Users can view redeem codes"
  ON public.redeem_codes FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update redeem codes (admin operations)
-- Note: This means you'll need to use service role key for admin operations
-- For now, we'll allow authenticated users to read, but restrict writes
-- You can create admin-only policies if needed

-- ============================================
-- 4. RLS Policies for redeemed_codes table
-- ============================================
ALTER TABLE public.redeemed_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own redeemed codes
CREATE POLICY "Users can view their own redeemed codes"
  ON public.redeemed_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert redeemed codes with their own user_id
CREATE POLICY "Users can insert their own redeemed codes"
  ON public.redeemed_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete redeemed codes (redemptions are permanent)
-- No UPDATE or DELETE policies needed

-- ============================================
-- 5. Grant necessary permissions
-- ============================================
GRANT SELECT ON public.redeem_codes TO authenticated;
GRANT SELECT, INSERT ON public.redeemed_codes TO authenticated;

-- ============================================
-- Example: Insert a test redeem code
-- ============================================
-- INSERT INTO public.redeem_codes (code, badge_type, max_uses, uses)
-- VALUES ('POKEVERSE', 'pokeverse_member', 100, 0)
-- ON CONFLICT (code) DO NOTHING;
