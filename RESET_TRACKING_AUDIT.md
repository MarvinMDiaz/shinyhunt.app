# Reset Tracking Audit

**Date:** Post database drift resolution  
**Canonical RPC:** `insert_hunt_progress_event(p_hunt_id uuid, p_reset_count integer)`  
**System:** TOTAL reset count only – no delta-based tracking

> **Canonical design:** The live app uses `insert_hunt_progress_event(p_hunt_id, p_reset_count)`. `reset_delta` is NOT used. Total-count tracking is the canonical design.

---

## 1. RPC Call Sites

| File | Line | Function | Arguments Passed | Confirmed Total Count? |
|------|------|----------|------------------|------------------------|
| `src/lib/supabase/progressEvents.ts` | 32–35 | (direct RPC call inside `recordProgressEvent`) | `p_hunt_id: huntId`, `p_reset_count: resetCount` | ✓ Yes – `resetCount` is the total count passed from caller |

**Single call site:** The RPC is only invoked from `recordProgressEvent` in `progressEvents.ts`. No other files call `supabase.rpc('insert_hunt_progress_event', ...)` directly.

---

## 2. Helper Functions

### `recordProgressEvent(huntId: string, resetCount: number)`
- **File:** `src/lib/supabase/progressEvents.ts` (lines 23–45)
- **Purpose:** Records a progress event when hunt encounters increase
- **Parameters:** `resetCount` = total encounter count (not delta)
- **RPC call:** `insert_hunt_progress_event` with `p_reset_count: resetCount`
- **Uses total count:** ✓ Yes – passes through the value as-is; no +/- logic
- **Delta logic:** None

### Caller: `incrementCount(delta: number)` in TrackerApp
- **File:** `src/components/TrackerApp.tsx` (lines 596–619)
- **Flow:** `newCount = currentHunt.count + delta` → `recordProgressEvent(currentHunt.id, newCount)` when `delta > 0`
- **Argument passed:** `newCount` (total count after increment)
- **Uses total count:** ✓ Yes – passes `newCount`, not `delta`
- **Delta logic:** `delta` is used only for local `HistoryEntry` and the `delta > 0` guard; it is NOT passed to `recordProgressEvent`

### `setCount(newCount: number)` in TrackerApp
- **File:** `src/components/TrackerApp.tsx` (lines 622–641)
- **Calls recordProgressEvent:** No – does not record progress events
- **Note:** Manual count changes (e.g. corrections) do not create progress events; only `incrementCount` does

### `getHuntProgressEvents(huntId: string)`
- **File:** `src/lib/supabase/progressEvents.ts` (lines 50–80)
- **Reads:** `row.reset_count` from `hunt_progress_events`
- **Uses total count:** ✓ Yes – maps to `resetCount`; no delta handling

### `calculateResetSpeed(huntId: string)`
- **File:** `src/lib/supabase/progressEvents.ts` (lines 86–136)
- **Uses:** `events.length` (number of rows) for total resets; time differences between consecutive events for speed
- **Delta logic:** None – does not use `reset_delta` or delta-based values

### Analytics (`getLiveAnalytics`)
- **File:** `src/lib/supabase/analytics.ts` (lines 137–151)
- **Uses:** Counts rows in `hunt_progress_events` per user (each row = 1 event)
- **Delta logic:** None – row count only

---

## 3. Any Delta Logic Found (if any)

**None in source code.** All application code uses `p_reset_count` and total count only.

**Cleanup completed:** Obsolete delta-based files have been removed:
- `supabase/migrations/20250312000002_add_reset_delta.sql` – **DELETED**
- `RESET_DELTA_VERIFICATION.md` – **DELETED**

---

## 4. Confirmation of Alignment

| Check | Status |
|-------|--------|
| RPC uses `p_reset_count` | ✓ |
| All call sites pass total count | ✓ |
| No `p_reset_delta` in source code | ✓ |
| No `reset_delta` column references in source code | ✓ |
| Helper functions use total count | ✓ |
| No delta-based +/- logic in progress tracking | ✓ |
| IMPORTANT comment added above `recordProgressEvent` | ✓ |

**Conclusion:** The application codebase is fully aligned with the canonical `insert_hunt_progress_event(p_hunt_id, p_reset_count)` RPC and total-count-only tracking. Delta references exist only in obsolete migration and documentation files.
