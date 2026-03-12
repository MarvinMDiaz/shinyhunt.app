# Profile Creation Trigger Fix - Explanation

## Problem

Signing in with a new Google account fails with:
```
Database error saving new user
```

The main account can sign in, suggesting the auth flow works but the database trigger that creates profile rows is failing for new users.

## Root Cause Analysis

The most likely constraint failure is a **UNIQUE username conflict**. Here's why:

1. **Original Trigger Logic**:
   ```sql
   username: COALESCE(
     NEW.raw_user_meta_data->>'full_name',
     NEW.raw_user_meta_data->>'name',
     split_part(NEW.email, '@', 1)
   )
   ```

2. **Conflict Scenario**:
   - User 1 signs up with `john@gmail.com` → username becomes `john`
   - User 2 signs up with `john@yahoo.com` → username becomes `john` → **UNIQUE CONSTRAINT VIOLATION**

3. **Other Potential Issues**:
   - Missing required columns (if any columns are NOT NULL without defaults)
   - Duplicate trigger execution (trigger runs, then `ensureProfileExists()` also tries to insert)
   - Special characters in username causing issues

## Solution

The fixed `handle_new_user()` function:

### 1. **Unique Username Generation**
```sql
-- Extract base username
base_username := COALESCE(
  NEW.raw_user_meta_data->>'full_name',
  NEW.raw_user_meta_data->>'name',
  split_part(NEW.email, '@', 1)
);

-- Clean and limit length
base_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '', 'g');
base_username := left(base_username, 30);

-- Check for conflicts and append suffix if needed
WHILE EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE username = final_username
) AND counter < max_attempts LOOP
  counter := counter + 1;
  username_suffix := '_' || left(NEW.id::text, 8);
  final_username := left(base_username, 30 - length(username_suffix)) || username_suffix;
END LOOP;
```

### 2. **Fallback Strategy**
- If base username conflicts → append user ID suffix (`john_abc12345`)
- If still conflicts after 100 attempts → use UUID-based username (`user_abc12345`)
- If all else fails → catch exception and use UUID fallback

### 3. **Safe Insert**
```sql
INSERT INTO public.profiles (...)
VALUES (...)
ON CONFLICT (id) DO NOTHING;
```
Prevents errors if:
- Trigger runs multiple times
- `ensureProfileExists()` also creates the profile
- Race conditions occur

### 4. **Exception Handling**
```sql
EXCEPTION
  WHEN unique_violation THEN
    -- Use UUID fallback
  WHEN OTHERS THEN
    -- Log warning but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
```

## Installation

1. **Open Supabase SQL Editor**:
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Run the SQL**:
   - Copy the contents of `supabase_profile_trigger_fix.sql`
   - Paste into SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify**:
   ```sql
   -- Check function exists
   SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
   
   -- Check trigger exists
   SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

## Testing

1. **Sign out** of your current account
2. **Sign in with a new Google account** (or use incognito mode)
3. **Check Supabase Dashboard**:
   - Go to Table Editor → `profiles` table
   - Verify a new row was created
   - Check that username is unique and doesn't conflict

## Expected Behavior After Fix

- ✅ New users can sign in without "Database error saving new user"
- ✅ Usernames are automatically unique (no conflicts)
- ✅ Profile rows are created automatically by trigger
- ✅ `ensureProfileExists()` still works as fallback (won't conflict due to `ON CONFLICT DO NOTHING`)

## Files

- **SQL Fix**: `supabase_profile_trigger_fix.sql` - Run this in Supabase SQL Editor
- **Explanation**: This document

## What Constraint Was Likely Failing?

**Most Likely**: `UNIQUE` constraint on `username` column

**Evidence**:
- Main account works (already has unique username)
- New accounts fail (username conflicts with existing users)
- Error message: "Database error saving new user" (generic constraint violation)

**Fix**: The new function checks for username conflicts before inserting and generates unique usernames with fallback logic.
