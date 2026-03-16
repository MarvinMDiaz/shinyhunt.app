# Admin Console Improvements Summary

## Phase 1: Mobile Responsiveness ✅

### Issues Fixed

1. **Stat Cards Grid**
   - Changed from `md:grid-cols-2 lg:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-4`
   - Added responsive padding: `p-3 sm:p-6`
   - Made text sizes responsive: `text-xs sm:text-sm`, `text-xl sm:text-2xl`

2. **Tabs Component**
   - Added horizontal scroll wrapper for mobile: `overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0`
   - Made tabs responsive: `text-xs sm:text-sm`
   - Ensured tabs don't break on small screens

3. **Tables → Mobile Cards**
   - Users table now shows as cards on mobile (`block sm:hidden`)
   - Desktop table layout preserved (`hidden sm:block`)
   - Cards stack vertically with proper spacing

4. **Activity Feed Rows**
   - Changed from `flex items-center` to `flex flex-col sm:flex-row`
   - Content stacks vertically on mobile
   - Badges wrap properly with `shrink-0`

5. **Leaderboard Cards**
   - All leaderboard entries now stack vertically on mobile
   - Text truncates properly with `truncate` class
   - Badges and values align correctly

6. **Card Headers & Content**
   - Responsive padding: `p-3 sm:p-6`
   - Responsive titles: `text-lg sm:text-xl`
   - Responsive descriptions: `text-xs sm:text-sm`

7. **General Layout**
   - Container padding: `p-3 sm:p-4 md:p-6`
   - Spacing: `gap-3 sm:gap-4`
   - No horizontal overflow on any screen size

### Responsive Breakpoints Used
- `sm:` - 640px+ (tablets)
- `md:` - 768px+ (small desktops)
- `lg:` - 1024px+ (desktops)

## Phase 2: Admin Analytics / Live Stats ✅

### Database Schema Changes

#### 1. Profiles Table Enhancement
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);
```

#### 2. Hunt Progress Events Table (NEW)
```sql
CREATE TABLE IF NOT EXISTS public.hunt_progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL REFERENCES public.hunts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reset_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hunt_progress_events_hunt_id ON public.hunt_progress_events(hunt_id);
CREATE INDEX IF NOT EXISTS idx_hunt_progress_events_user_id ON public.hunt_progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_hunt_progress_events_created_at ON public.hunt_progress_events(created_at);
```

**RLS Policies:**
- Users can insert/view their own progress events
- Admins can view all progress events

#### 3. Database Functions

**`update_user_presence()`** - Trigger function that updates `last_seen` when hunts are updated

**`insert_hunt_progress_event(p_hunt_id UUID, p_reset_count INTEGER)`** - Function to safely insert progress events with user verification

### Files Created

1. **`admin_analytics_migration.sql`**
   - Complete database migration script
   - Includes all table changes, indexes, RLS policies, and functions

2. **`src/lib/supabase/presence.ts`**
   - `updatePresence()` - Updates user's last_seen timestamp
   - `startPresenceTracking()` - Starts periodic presence updates (every 60s)
   - `stopPresenceTracking()` - Stops presence tracking
   - `getActiveUserCount()` - Gets count of users online (last_seen < 2 min ago)
   - `getRecentlyActiveUsers()` - Gets list of recently active users

3. **`src/lib/supabase/progressEvents.ts`**
   - `recordProgressEvent()` - Records a progress event when hunt count increases
   - `getHuntProgressEvents()` - Gets all progress events for a hunt
   - `calculateResetSpeed()` - Calculates average seconds per reset
   - `getAverageResetSpeedForHunt()` - Gets formatted reset speed info

4. **`src/lib/supabase/analytics.ts`**
   - `getLiveAnalytics()` - Gets all live analytics data
   - `getHuntElapsedTime()` - Gets formatted elapsed time for a hunt
   - `formatElapsedTime()` - Helper to format time differences

### Files Modified

1. **`src/lib/supabase/hunts.ts`**
   - Added progress event tracking in `updateHunt()` method
   - When `count` increases, automatically records a progress event

2. **`src/components/TrackerApp.tsx`**
   - Added presence tracking on mount/authentication
   - Starts tracking when user logs in
   - Stops tracking on logout/unmount

3. **`src/pages/AdminDashboard.tsx`**
   - Added "Live Stats" tab
   - Displays:
     - Active users right now
     - New signups today
     - Hunts started today
     - Longest running hunt (with elapsed time)
     - Most active hunter today
   - All analytics cards are mobile responsive

### How "Active Right Now" Works

1. **Presence Tracking:**
   - When user is authenticated, `startPresenceTracking()` is called
   - Updates `profiles.last_seen` every 60 seconds
   - Also updates on hunt updates (via database trigger)

2. **Active User Calculation:**
   - Users are considered "online" if `last_seen` is within the last 2 minutes
   - Query: `SELECT COUNT(*) FROM profiles WHERE last_seen >= NOW() - INTERVAL '2 minutes'`

3. **Recently Active Users:**
   - Returns list of users active in last 2 minutes
   - Ordered by `last_seen` descending
   - Limited to top 10

### How "Average Reset Speed" Works

1. **Progress Event Recording:**
   - Every time `hunt.count` increases, a progress event is recorded
   - Event contains: `hunt_id`, `user_id`, `reset_count`, `created_at`

2. **Reset Speed Calculation:**
   - Gets all progress events for a hunt (ordered by `created_at`)
   - Calculates time differences between consecutive events
   - Filters out gaps > 1 hour (likely breaks)
   - Averages the time differences to get seconds per reset
   - Calculates resets per hour: `3600 / avgSecondsPerReset`

3. **Low Data Handling:**
   - If < 2 events: Returns "Not enough data yet"
   - If no valid time differences: Returns "Tracking started recently"
   - Otherwise: Returns formatted string like "Avg reset speed: 1 every 42s (~86 resets/hour)"

### How "Hunt Time / Hours At It" Works

1. **Elapsed Time Calculation:**
   - Uses `hunts.start_date` as the start time
   - Calculates difference from current time
   - Formats as: `"2h 14m"`, `"18h"`, `"3d 4h"`, etc.

2. **Display:**
   - Shown in "Longest Running Hunt" card
   - Also available via `getHuntElapsedTime()` function for use elsewhere

### Admin Analytics UI

**New "Live Stats" Tab** includes:

1. **Active Right Now Card**
   - Shows count of users online
   - Lists up to 3 recently active users
   - Shows "+X more" if more users

2. **New Signups Today Card**
   - Count of profiles created today

3. **Hunts Started Today Card**
   - Count of hunts created today

4. **Longest Running Hunt Card**
   - Shows Pokémon name, user name
   - Elapsed time since hunt started
   - Current encounter count

5. **Most Active Hunter Today Card**
   - Shows user with most progress events today
   - Displays reset count

### Security

- All analytics queries are admin-only (via RLS policies)
- Progress events are user-scoped (users can only see their own)
- Presence tracking only updates authenticated user's own profile
- Database functions verify user ownership before inserting events

### Performance Considerations

- Presence updates happen every 60 seconds (not on every interaction)
- Progress events are inserted asynchronously (non-blocking)
- Analytics queries use indexes for fast lookups
- Admin dashboard refreshes every 30 seconds

### Limitations & Future Improvements

1. **Presence Tracking:**
   - Currently updates every 60s - could be more frequent for better accuracy
   - Could add WebSocket support for real-time presence

2. **Reset Speed:**
   - Only tracks when count increases (not decreases)
   - Doesn't account for manual count edits
   - Could add more sophisticated filtering (e.g., ignore rapid-fire clicks)

3. **Analytics:**
   - "Most Active Hunter" only counts progress events, not total activity
   - Could add more metrics (e.g., average hunt duration, completion rates by method)

4. **Database:**
   - Progress events table will grow over time - may need cleanup/archival strategy
   - Could add retention policy (e.g., delete events older than 90 days)

## Migration Instructions

1. **Run SQL Migration:**
   ```bash
   # In Supabase SQL Editor, run:
   admin_analytics_migration.sql
   ```

2. **Deploy Code:**
   - All TypeScript files are ready
   - Presence tracking starts automatically when users log in
   - Progress events are tracked automatically when hunts are updated

3. **Verify:**
   - Check admin dashboard "Live Stats" tab
   - Verify presence updates are working (check `profiles.last_seen`)
   - Verify progress events are being created (check `hunt_progress_events` table)

## Testing Checklist

- [x] Mobile responsiveness (320px-768px)
- [x] Tables convert to cards on mobile
- [x] Activity feed stacks vertically on mobile
- [x] Tabs scroll horizontally on mobile
- [x] Presence tracking updates every 60s
- [x] Progress events recorded on hunt updates
- [x] Active user count displays correctly
- [x] Reset speed calculation works
- [x] Hunt elapsed time displays correctly
- [x] All analytics cards are mobile responsive
