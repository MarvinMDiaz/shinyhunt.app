# Admin Refresh Audit

**Date:** Post-stability review  
**Focus:** Admin dashboard polling, query load, and stabilization options

---

## 1. Polling Locations

| File | Component/Function | Interval | What Runs | Cleanup | Rerender/Instability Risk |
|------|-------------------|----------|------------|---------|---------------------------|
| `src/pages/AdminDashboard.tsx` | `AdminDashboard` | 30s | `loadData(false)` → 8 functions, ~26 Supabase queries | ✓ `clearInterval` in useEffect return | **High** – 8 `setState` calls every 30s; full re-render of dashboard |
| `src/lib/supabase/presence.ts` | `startPresenceTracking` | 60s | `updatePresence()` → 1 profiles UPDATE | ✓ `stopPresenceTracking` clears interval | Low – single write; called from TrackerApp when authenticated |
| `src/components/ProgressPanelV3.tsx` | `handleMouseDown` | 100ms | `onIncrement(delta)` while button held | ✓ `handleMouseUp` clears; useEffect cleanup | Low – short-lived; cleared on mouseup |
| `src/components/First151CelebrationPopup.tsx` | `First151CelebrationPopup` | 500ms | `setShowSparkles(prev => !prev)` | ✓ `clearInterval` in useEffect return | Low – UI animation only; runs only when popup open |

**Admin-specific:** Only `AdminDashboard.tsx` polls for admin data. The 30s interval is the sole cause of periodic admin refresh.

---

## 2. Query Load

### Per AdminDashboard refresh (every 30 seconds)

| Function | Queries | Tables | Notes |
|----------|---------|--------|-------|
| `getAdminStats` | 2 | profiles (all), hunts (all) | Full table scans |
| `getUserOverview` | 2 | profiles (all), hunts (all) | Duplicate of getAdminStats data |
| `getRecentActivity(50)` | 2 | profiles (50), hunts (100) | Overlaps with above |
| `getPopularPokemon` | 1 | hunts (all) | Third full hunts fetch |
| `getLongestHunts(10)` | 1 | hunts (20) | Fourth hunts fetch |
| `getTopUsersByCompletions(10)` | 2 | hunts (all completed), profiles (10) | Fifth hunts fetch |
| `getTopUsersByActiveHuntLength(10)` | 2 | hunts (20), profiles (10) | Sixth hunts fetch |
| `getLiveAnalytics` | ~15 | profiles (multiple), hunts (multiple), hunt_progress_events | See breakdown below |

**getLiveAnalytics breakdown:**
- `getActiveUsersNow(10)` → 1 profiles query
- New signups today → 1 profiles query
- Hunts started today → 1 hunts query
- Longest running hunts → 1 hunts query + 5 profiles queries (parallel, for user names)
- Most active hunters → 1 hunt_progress_events query + 5 profiles queries (parallel)
- `getSession()` → auth (not a table query)

**Approximate total per refresh:** ~26–30 Supabase queries every 30 seconds.

### Duplicate / overlapping queries

| Data | Fetched by | Count |
|------|------------|-------|
| All profiles | getAdminStats, getUserOverview | 2× |
| All hunts | getAdminStats, getUserOverview, getPopularPokemon, getTopUsersByCompletions | 4× |
| Profiles (subset) | getRecentActivity, getLiveAnalytics, getTopUsersByCompletions, getTopUsersByActiveHuntLength | Multiple overlapping |
| Hunts (subset) | getRecentActivity, getLongestHunts, getTopUsersByActiveHuntLength, getLiveAnalytics | Multiple overlapping |

### Expensive repeated queries

1. **Full profiles scan** – `getAdminStats` and `getUserOverview` both fetch all profiles.
2. **Full hunts scan** – `getAdminStats`, `getUserOverview`, `getPopularPokemon`, `getTopUsersByCompletions` all fetch all or most hunts.
3. **hunt_progress_events (today)** – `getLiveAnalytics` fetches all progress events from today; can grow large with active users.
4. **No pagination** – User overview, recent activity, and leaderboards load fixed limits but underlying queries still pull full tables in some paths.

---

## 3. Stability Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **30s full refresh** | High | Every 30s, 8 `setState` calls update the entire dashboard. All tabs re-render even if not visible. |
| **No tab-aware refresh** | Medium | Live Stats tab needs fresher data; Overview/Users/Activity change slowly. All refresh at same rate. |
| **No request deduplication** | Medium | If a refresh is slow, the next 30s tick can start before the previous one finishes, doubling load. |
| **No error boundary** | Medium | A failing query can leave dashboard in partial state; no graceful degradation. |
| **Presence + Admin** | Low | If admin has TrackerApp mounted (e.g. in another tab), presence updates every 60s. Unrelated to admin refresh. |
| **Memory** | Low | `loadData` uses `Promise.all`; no obvious leaks. State updates replace references. |

### What explains “admin console refreshing on its own”

The 30s `setInterval` in `AdminDashboard` is the only source. Each tick:
1. Calls `loadData(false)`
2. Runs 8 async functions in parallel
3. On completion, updates 8 state variables
4. React re-renders the whole dashboard
5. User sees updated numbers/cards

There is no other auto-refresh (e.g. visibility change, focus, or realtime subscriptions).

---

## 4. Recommended Safe Fix

**Do not implement yet.** Use this as a plan.

### Phase 1: Reduce load (safest)

1. **Increase polling interval**  
   - Change 30s → 60s or 90s for non-Live tabs.  
   - Live Stats can stay at 30s if split out (see Phase 2).

2. **Add in-flight guard**  
   - Before calling `loadData`, check a `loadingRef` / `isRefreshing` flag.  
   - Skip the next tick if the previous run is still in progress.

3. **Add error boundary**  
   - Wrap `AdminDashboard` in an error boundary so a single failing query does not break the whole page.

### Phase 2: Split refresh by tab (medium effort)

1. **Tab-specific intervals**  
   - Live Stats: 30–60s (active users, resets today, etc.).  
   - Overview / Stats / Pokémon: 90–120s.  
   - Users / Activity / Leaderboards: 120s or manual refresh.

2. **Refresh only visible tab**  
   - Use `Tabs` `value` to decide which data to fetch.  
   - When switching tabs, fetch that tab’s data if stale.

### Phase 3: Consolidate queries (higher effort)

1. **Single admin stats endpoint**  
   - Add a Supabase RPC or Edge Function that returns: stats, user overview, recent activity, popular Pokémon, leaderboards in one call.  
   - Reduces round-trips and allows DB-side aggregation.

2. **Reuse profiles/hunts**  
   - `getAdminStats` and `getUserOverview` both need profiles + hunts.  
   - Fetch once and derive both from the same result.

### Phase 4: Realtime (optional)

1. **Supabase Realtime for Live Stats**  
   - Subscribe to `profiles` (e.g. `last_seen`) and `hunt_progress_events` for “active now” and “resets today”.  
   - Replace or supplement polling for the Live tab.

### Suggested order

1. Phase 1.1 (60s interval) + 1.2 (in-flight guard) + 1.3 (error boundary) – low risk, quick wins.  
2. Phase 2 (tab-aware refresh) – medium effort, good impact.  
3. Phase 3 (consolidate queries) – requires backend work.  
4. Phase 4 (realtime) – optional, for Live Stats only.
