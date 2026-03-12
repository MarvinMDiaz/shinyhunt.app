# Profile Creation Fix

## Issue
Profiles are not being created in the Supabase `profiles` table when users sign up with Google OAuth.

## Root Cause
The code assumes a database trigger exists to auto-create profiles, but:
1. The trigger may not exist
2. The trigger may not be working correctly
3. The app needs to handle profile creation manually as a fallback

## Fix Applied

### 1. Created `ensureProfileExists()` Function
**File:** `src/lib/supabase/auth.ts`

This function:
- Checks if a profile exists for the user
- Creates a profile if it doesn't exist
- Uses user metadata from `auth.users` to populate initial values

### 2. Updated Auth Callback
**File:** `src/pages/AuthCallback.tsx`

The callback now:
- Calls `ensureProfileExists()` immediately after successful authentication
- Creates the profile before redirecting to the app
- Logs errors but doesn't fail auth if profile creation fails

### 3. Updated Profile Initialization
**File:** `src/lib/supabase/auth.ts`

`initializeUserProfile()` now:
- Calls `ensureProfileExists()` first to ensure profile exists
- Then assigns `signup_number` and badges

## Database Setup Required

### Create the `profiles` Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  signup_number INTEGER,
  badges JSONB DEFAULT '[]'::jsonb,
  has_seen_first_151_popup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index on signup_number for faster queries
CREATE INDEX IF NOT EXISTS profiles_signup_number_idx ON public.profiles(signup_number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Optional: Create Auto-Profile Trigger (Recommended)

If you want profiles to be created automatically by a trigger:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Testing

1. **Sign up with Google OAuth**
2. **Check Supabase Dashboard:**
   - Go to Table Editor → `profiles` table
   - Verify a row was created with your user ID
   - Check that `signup_number` and `badges` are set correctly

3. **Check Browser Console:**
   - Look for `[EnsureProfile]` logs
   - Look for `[InitProfile]` logs
   - Verify no errors

## Troubleshooting

### Profile Still Not Created?

1. **Check RLS Policies:**
   - Ensure the policies allow users to insert their own profiles
   - Check Supabase Dashboard → Authentication → Policies

2. **Check Console Logs:**
   - Look for `[EnsureProfile]` error messages
   - Check if there are permission errors

3. **Manual Test:**
   - Try inserting a profile manually in Supabase SQL Editor:
   ```sql
   INSERT INTO public.profiles (id, username, role)
   VALUES ('your-user-id-here', 'test', 'user');
   ```

4. **Check Table Exists:**
   - Verify the `profiles` table exists in the `public` schema
   - Check column names match the code expectations

## Files Modified

1. `src/lib/supabase/auth.ts` - Added `ensureProfileExists()` function
2. `src/pages/AuthCallback.tsx` - Calls `ensureProfileExists()` after auth success
3. `src/lib/supabase/auth.ts` - Updated `initializeUserProfile()` to ensure profile exists first
