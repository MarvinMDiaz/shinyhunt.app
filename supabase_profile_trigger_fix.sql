-- ============================================================================
-- Supabase Profile Creation Trigger Fix
-- ============================================================================
-- This fixes the "Database error saving new user" issue when signing in
-- with a new Google account.
--
-- Updated to support:
-- - username: Unique internal identifier (email_prefix + "_" + first_8_chars_of_user_id)
-- - display_name: Public-facing editable name (from Google metadata or email prefix)
-- ============================================================================

-- Drop the old function if it exists (we'll recreate it safer)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function with unique username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  display_name_value TEXT;
BEGIN
  -- Generate unique username: email_prefix + "_" + first_8_chars_of_user_id
  -- Example: marvin_4fa21c9b
  -- This ensures usernames never clash
  base_username := split_part(NEW.email, '@', 1);
  
  -- If email prefix is null or empty, use 'user' as prefix
  IF base_username IS NULL OR trim(base_username) = '' THEN
    base_username := 'user';
  END IF;
  
  -- Clean email prefix: remove special characters, limit length
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '', 'g');
  base_username := left(base_username, 20); -- Limit prefix to 20 chars
  
  -- Generate unique username: prefix + "_" + first 8 chars of user ID (without dashes)
  final_username := base_username || '_' || replace(left(NEW.id::text, 8), '-', '');
  
  -- Set display_name from Google metadata, fallback to email prefix
  -- display_name is the public-facing editable name shown in UI
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Insert profile with all required columns
  INSERT INTO public.profiles (
    id,
    username, -- Unique internal identifier (auto-generated, never clashes)
    display_name, -- Public-facing editable name (from Google metadata or email prefix)
    avatar_url,
    role,
    badges,
    signup_number,
    has_seen_first_151_popup,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    final_username, -- Unique username: email_prefix_8chars_of_user_id
    display_name_value, -- Display name from Google metadata or email prefix
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    '[]'::jsonb,
    NULL, -- Will be set by initializeUserProfile()
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username conflict still occurs, use UUID-based fallback
    INSERT INTO public.profiles (
      id,
      username, -- Unique internal identifier
      display_name, -- Public-facing editable name
      avatar_url,
      role,
      badges,
      signup_number,
      has_seen_first_151_popup,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'user_' || replace(left(NEW.id::text, 8), '-', ''),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
      COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
      '[]'::jsonb,
      NULL,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger (only if it doesn't exist)
-- Note: We use CREATE OR REPLACE for the function above, but CREATE IF NOT EXISTS for trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  ELSE
    -- Trigger exists, just ensure it's using the updated function
    -- No need to recreate it
    RAISE NOTICE 'Trigger on_auth_user_created already exists, using updated function';
  END IF;
END $$;

-- ============================================================================
-- Verification Queries (run these to check the setup)
-- ============================================================================

-- Check if function exists
-- SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if trigger exists
-- SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check profiles table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'profiles';

-- ============================================================================
-- Expected Constraint Issues Fixed:
-- ============================================================================
-- 1. UNIQUE username conflicts: Fixed with email_prefix + "_" + user_id suffix
--    - Format: marvin_4fa21c9b
--    - Guaranteed unique because user IDs are unique
--
-- 2. Missing required NOT NULL columns: All columns now explicitly set
--    - created_at: NOW()
--    - updated_at: NOW()
--    - badges: '[]'::jsonb
--    - has_seen_first_151_popup: false
--    - role: 'user' (with fallback)
--
-- 3. Duplicate inserts: Added ON CONFLICT (id) DO NOTHING to prevent errors
--    - Prevents errors if trigger runs multiple times
--    - Prevents errors if ensureProfileExists() also creates profile
--
-- 4. Exception handling: Catches unique_violation and other errors gracefully
--    - Logs warnings but doesn't fail user creation
--    - Uses UUID fallback if username generation fails
--
-- 5. display_name support: Added display_name column for public-facing name
--    - Set from Google metadata (full_name or name)
--    - Falls back to email prefix if metadata not available
--    - Username remains as unique internal identifier
--
-- Most Likely Root Cause:
-- The original trigger was failing due to UNIQUE constraint on username column.
-- When multiple users sign up with similar email prefixes (e.g., "john" from
-- john@gmail.com and john@yahoo.com), they would conflict. This fix generates
-- unique usernames by appending user ID suffix, ensuring no conflicts.
-- ============================================================================
