# Admin Dashboard Refresh Strategy

## Current Behavior

- **Polling interval:** 60 seconds
- **Visibility check:** Refresh only runs when `document.visibilityState === 'visible'` (hidden tabs do not refresh)
- **Tab-scoped refresh:** Only the active admin sub-tab is refreshed; hidden tabs are not refreshed in the background
- **Manual refresh:** A Refresh button triggers the same flow for the current tab; respects in-flight guard and visibility
- **In-flight guard:** Shared ref prevents overlapping refreshes; a new refresh cannot start while another is running
- **Initial load:** Fetches all data once on mount; subsequent refreshes are tab-specific

## Known Heavy Hotspots

| Area | Issue |
|------|-------|
| Live tab / `getLiveAnalytics` | ~15 queries (profiles, hunts, hunt_progress_events, multiple profile lookups) |
| Overview / Stats | Full scans of `profiles` and `hunts` |
| Users | Full scans of `profiles` and `hunts` |
| Leaderboards | `getPopularPokemon` scans all hunts |

## Future Optimization Ideas

- **RPC/Edge Function consolidation** – Single admin endpoint returning stats, users, activity, etc. in one call
- **Query deduplication** – Reuse profiles/hunts across `getAdminStats` and `getUserOverview` instead of fetching twice
- **Realtime for Live tab only** – Supabase Realtime on `profiles` and `hunt_progress_events` to replace polling for Live Stats
- **Optional render error boundary** – Wrap AdminDashboard to catch React render errors and avoid full-page crash
