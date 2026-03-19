# Progress Bar Color

The color picker in the Progress panel controls only the progress bar color. Saves to Supabase and restores on refresh/login.

## Database Setup

Run this in your Supabase SQL Editor:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS progress_color TEXT;

COMMENT ON COLUMN public.profiles.progress_color IS 'User-selected hex for progress bar only (e.g. #22c55e).';
```

Or run: `supabase/migrations/20250312000001_add_progress_color.sql`
