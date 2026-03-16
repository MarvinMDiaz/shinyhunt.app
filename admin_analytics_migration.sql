-- Admin Analytics Migration
-- Adds presence tracking and hunt progress events for analytics

-- 1. Add last_seen column to profiles table (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Create index for faster presence queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);

-- 2. Create hunt_progress_events table for tracking reset speed
CREATE TABLE IF NOT EXISTS public.hunt_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL REFERENCES public.hunts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reset_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_hunt_progress_events_hunt_id ON public.hunt_progress_events(hunt_id);
CREATE INDEX IF NOT EXISTS idx_hunt_progress_events_user_id ON public.hunt_progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hunt_progress_events_created_at ON public.hunt_progress_events(created_at);

-- Enable RLS
ALTER TABLE public.hunt_progress_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hunt_progress_events
-- Users can insert their own progress events
CREATE POLICY "Users can insert their own progress events"
  ON public.hunt_progress_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own progress events
CREATE POLICY "Users can view their own progress events"
  ON public.hunt_progress_events FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all progress events (for analytics)
-- Note: This requires admin_users table to exist
CREATE POLICY "Admins can view all progress events"
  ON public.hunt_progress_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 3. Create function to update user presence (last_seen)
CREATE OR REPLACE FUNCTION update_user_presence()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update presence on hunt updates
-- This will update last_seen whenever a user updates a hunt
CREATE OR REPLACE TRIGGER update_presence_on_hunt_update
AFTER INSERT OR UPDATE ON public.hunts
FOR EACH ROW
EXECUTE FUNCTION update_user_presence();

-- 4. Create function to insert progress event (can be called from frontend)
CREATE OR REPLACE FUNCTION insert_hunt_progress_event(
  p_hunt_id UUID,
  p_reset_count INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_event_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Verify user owns the hunt
  IF NOT EXISTS (
    SELECT 1 FROM public.hunts 
    WHERE id = p_hunt_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Hunt not found or access denied';
  END IF;
  
  -- Insert progress event
  INSERT INTO public.hunt_progress_events (hunt_id, user_id, reset_count)
  VALUES (p_hunt_id, v_user_id, p_reset_count)
  RETURNING id INTO v_event_id;
  
  -- Update user presence
  UPDATE public.profiles
  SET last_seen = NOW()
  WHERE id = v_user_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_hunt_progress_event(UUID, INTEGER) TO authenticated;
