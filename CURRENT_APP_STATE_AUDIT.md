# Current App State Audit

**Date:** Post-checkpoint revert (0977329)  
**Checkpoint:** "Checkpoint: Admin console improvements before major changes"  
**Last updated:** Post delta-cleanup (reset tracking aligned)

---

## Canonical Reset Tracking Design

- **RPC:** `insert_hunt_progress_event(p_hunt_id uuid, p_reset_count integer)`
- **Tracking:** TOTAL reset count only. `reset_delta` is NOT used.
- **Source:** `src/lib/supabase/progressEvents.ts` → `recordProgressEvent(huntId, resetCount)`

---

## 1. Executive Summary

The Shinny Tracker app is a Pokémon shiny-hunting progress tracker. After reverting to checkpoint `0977329`, the app is in a stable state. **Reset tracking uses total count only** (`p_reset_count`); delta-based design has been removed. Migrations add `profiles.progress_color` and `profiles.accent_color`, but the app does not read or write them. Progress bar color is stored per-hunt in local state only, not in the database.

---

## 2. Tech Stack and Architecture

| Layer | Technology |
|-------|------------|
| Framework | React 18.2 |
| Build | Vite 5.0.8 |
| Routing | React Router DOM 7.13 |
| UI | Radix UI (dialog, dropdown, tabs, toast, checkbox, popover, radio), Tailwind CSS, Framer Motion, Lucide React, react-colorful |
| Backend | Supabase JS 2.99 |
| State | React Context (Auth, UserProfile), local component state, `storageService` adapter |
| Styling | Tailwind CSS, `cn()` utility |

**Key directories:**
- `src/components/` – UI components (TrackerApp, ProgressPanelV3, HuntDetails, ProgressColorPicker, etc.)
- `src/context/` – AuthContext, UserProfileContext
- `src/lib/` – Core logic (auth, storage, Supabase modules)
- `src/lib/supabase/` – client, auth, hunts, storage, analytics, presence, progressEvents, redeemCodes, admin
- `src/pages/` – Route pages
- `src/hooks/` – useAdmin, use-toast
- `supabase/migrations/` – 2 SQL migration files (accent_color, progress_color)

---

## 3. Routes / Pages / Major Features

| Path | Component | Purpose |
|------|-----------|---------|
| `/`, `/home` | HomePage | Landing |
| `/login` | LoginPage | Google OAuth login |
| `/signup` | SignupPage | Signup |
| `/tracker`, `/tracker/*` | TrackerApp | Main hunt tracker (tabs: Active Hunts, Shiny Collection) |
| `/pokemon/:pokemon-name-shiny-hunt` | PokemonHuntPage | Pokémon-specific hunt page |
| `/guides` | GuidesPage | Guides |
| `/admin` | AdminGuard → AdminDashboard | Admin-only dashboard |

**TrackerApp features:** Hunt switcher, hunt details, progress panel (+/- buttons, progress bar, color picker), accomplished view, create/rename/delete/complete/reset dialogs.

---

## 4. Auth and Permissions

**Auth flow:**
1. `AuthContext` (`src/context/AuthContext.tsx`) – `getSession()`, `onAuthStateChange()`
2. Google OAuth via `signInWithOAuth`
3. Redirect URL: `VITE_AUTH_REDIRECT_URL` or derived from hostname
4. `UserProfileProvider` loads profile via `getUserProfile` when authenticated
5. `ensureProfileExists` creates profile on first sign-in

**Admin:**
- `AdminGuard` wraps AdminDashboard
- `useAdmin` / `checkIsAdmin()` queries `admin_users` table
- No `VITE_ADMIN_EMAIL` in current code; admin via `admin_users` table

**Route protection:** Only `/admin` is guarded. Other routes are public; components may show different UI when unauthenticated.

---

## 5. Supabase / Database Dependencies

### Tables referenced in code

| Table | Purpose | Key columns used |
|-------|---------|------------------|
| `profiles` | User profiles | id, display_name, username, email, avatar_url, badges, signup_number, founder_badge, founder_popup_shown, last_seen, created_at, last_active_at |
| `hunts` | Hunt data | id, user_id, pokemon_name, pokemon_dex_number, game, start_date, target_attempts, current_encounters, status, shiny_found, final_encounters, completed_at, created_at |
| `hunt_progress_events` | Progress events | id, hunt_id, user_id, created_at, reset_count |
| `admin_users` | Admin user IDs | (id check) |
| `redeem_codes` | Redeem codes | (validated via RPC) |
| `redeemed_codes` | Redemption records | (used in redeem flow) |

### RPCs

| RPC | Params | Status |
|-----|--------|--------|
| `insert_hunt_progress_event` | `p_hunt_id`, `p_reset_count` | ✓ Canonical – total count only. `reset_delta` is not used. |

**File:** `src/lib/supabase/progressEvents.ts` lines 32–35

### Storage

- Bucket: `avatars` (from `src/lib/supabase/storage.ts`)

### Migrations (repo)

**Supabase migrations** (`supabase/migrations/`):
| File | Summary |
|------|---------|
| `20250312000000_add_accent_color.sql` | Adds `profiles.accent_color` (TEXT) |
| `20250312000001_add_progress_color.sql` | Adds `profiles.progress_color` (TEXT) |

**Standalone SQL files** (not in `supabase/migrations/`):
| File | Summary |
|------|---------|
| `admin_analytics_migration.sql` | Creates `hunt_progress_events` with `reset_count`, adds `profiles.last_seen`, defines `insert_hunt_progress_event(p_hunt_id, p_reset_count)` – **matches current code** |
| `supabase_profile_trigger_fix.sql` | Profile trigger fix |
| `redeem_codes_rls_policies.sql` | RLS for redeem codes |
| `founder_badge_schema.sql` | Founder badge schema |

### Orphaned / unused

- `profiles.accent_color` – migration adds it; **not used in code**
- `profiles.progress_color` – migration adds it; **not used in code** (progress color is per-hunt in local state)

### Columns possibly missing

- `profiles.last_seen` – used by presence; not in migrations (may exist from other SQL)
- `profiles.last_active_at` – used by adminData; not in migrations
- `profiles.created_at` – used by adminData; may be auto-added
- `profiles.email` – used by presence, analytics; may come from trigger or join
- `hunts.created_at` – used by adminData, analytics; may be auto-added

---

## 6. Data Model Summary

### profiles
- **Purpose:** User profile (display name, avatar, badges, founder state)
- **Read:** `getUserProfile`, presence, adminData, analytics
- **Write:** `ensureProfileExists`, `updateProfileAvatar`, `updateProfileDisplayName`, presence (`last_seen`)

### hunts
- **Purpose:** Shiny hunt records
- **Schema (code):** id, user_id, pokemon_name, pokemon_dex_number, game, start_date, target_attempts, current_encounters, status, shiny_found, final_encounters, completed_at
- **Note:** App `Hunt` type has count, history, goal, progressColor, etc. These are mapped/transformed; `progressColor` is not stored in DB (`hunts.ts` line 223: `progressColor: undefined`)

### hunt_progress_events
- **Purpose:** Per-reset events for analytics and reset speed
- **Read:** `getHuntProgressEvents`, `calculateResetSpeed`, analytics
- **Write:** `recordProgressEvent` via RPC (`p_reset_count` = total count)

---

## 7. Hunt Systems Status

| Feature | Status | Notes |
|---------|--------|-------|
| Hunt CRUD | WORKING | Via storageService → Supabase when authenticated |
| Progress +/− | WORKING | Updates local state; calls `recordProgressEvent` (RPC may fail) |
| Progress bar | WORKING | Uses `hunt.progressColor` (local only) |
| ProgressColorPicker | WORKING | Controlled component; `color` + `onChange`; no Supabase |
| Reset speed | WORKING | `calculateResetSpeed` uses `reset_count` |
| Daily Activity (Resets Today/Hour) | NOT FOUND | No `getDailyActivityStats`; was in reverted commits |
| Presence | WORKING | 60s interval, updates `profiles.last_seen` |
| Badges | WORKING | Via profiles.badges, redeem codes |

---

## 8. Admin Systems Status

**AdminDashboard** (`src/pages/AdminDashboard.tsx`):
- Stats: total users, active users, new users (7d), hunts, shinies, avg encounters
- Live: active users now, new signups today, hunts started today, longest hunts, most active hunters today
- User overview, recent activity, popular Pokémon, leaderboards
- **Polling:** `setInterval` every 30s to refresh all data (line 99)

**Data sources:** `getAdminStats`, `getUserOverview`, `getRecentActivity`, `getPopularPokemon`, `getLongestHunts`, `getTopUsersByCompletions`, `getTopUsersByActiveHuntLength`, `getLiveAnalytics`

**Stability:** 30s polling of 8+ Supabase queries may cause load; no error boundaries around admin components.

---

## 9. Realtime / Polling / Auto-Refresh Audit

| Location | Type | Interval | Purpose |
|----------|------|----------|---------|
| `presence.ts` | `setInterval` | 60s | Update `profiles.last_seen` |
| `AdminDashboard.tsx` | `setInterval` | 30s | Refresh all admin data |
| `ProgressPanelV3.tsx` | `setInterval` | 100ms | Hold-to-repeat +/− (cleared on mouseup) |
| `First151CelebrationPopup.tsx` | `setInterval` | 1s | Countdown |
| `TrackerApp.tsx` | `setTimeout` | 500ms | UI delays (e.g. after migration) |
| `AuthContext` | `onAuthStateChange` | Event | Auth state listener |

**Risks:** Admin 30s polling is heavy. Presence 60s is reasonable. Hold interval is short-lived and cleaned up.

---

## 10. Logging / Security Audit

**Logging:**
- Centralized in `src/lib/logger.ts` (debug, info, warn, error)
- Prebuild: `scripts/check-console-usage.js` blocks raw `console.*` except in logger
- Production: `productionConsoleGuard.ts` overrides console methods

**Sensitive data:** Logger redacts ids, tokens, emails, etc. Production guard sanitizes console output.

**Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` required. `VITE_AUTH_REDIRECT_URL` optional. `VITE_ADMIN_EMAIL` declared but not used.

---

## 11. Rollback Drift / Partial Work Found

### Suspected checkpoint revert impact

1. **Migration vs code:** Migrations add `progress_color`, `accent_color`. Code does not use them. Reset tracking uses `p_reset_count` (total count) – canonical design.

3. **Daily Activity:** "Resets Today" / "Resets Per Hour" in Progress panel were added in reverted commits; not present now.

4. **UserProfileContext:** No `updateProgressColor`; no `progress_color` in Profile. Progress color is per-hunt only.

5. **ProgressColorPicker:** Simple controlled component (`color`, `onChange`); no Supabase, no UserProfile.

### Orphaned / partial code

- `profiles.accent_color`, `profiles.progress_color` – in migrations, unused in code
- `recordProgressEvent` – called with `newCount` (total); RPC uses `p_reset_count` ✓
- `adminData` uses `profiles.last_active_at`, `profiles.created_at` – may not exist
- `presence` uses `profiles.email` – may not exist on profiles

---

## 12. Feature Readiness Matrix

| Feature | Status | Reason |
|---------|--------|--------|
| Auth (Google OAuth) | WORKING | AuthContext, Supabase auth |
| User profiles | WORKING | UserProfileContext, getUserProfile |
| Hunt CRUD | WORKING | storageService, Supabase hunts |
| Progress +/− | WORKING | Local state; recordProgressEvent may fail silently |
| Progress bar color | WORKING | Per-hunt, local state only |
| ProgressColorPicker | WORKING | Controlled, no persistence |
| Presence | WIRED BUT UNVERIFIED | Depends on `profiles.last_seen` |
| Admin dashboard | WIRED BUT UNVERIFIED | Depends on profiles/hunts columns |
| insert_hunt_progress_event | WORKING | Uses `p_reset_count` (total count) |
| Daily Activity stats | NOT FOUND | Removed by revert |
| profiles.progress_color | NOT FOUND | Migration adds; code does not use |

---

## 13. Top Stability Risks

1. **Missing DB columns** – `last_seen`, `last_active_at`, `created_at`, `email` on profiles may not exist; presence and admin could fail.

2. **Admin polling** – 30s refresh of 8+ queries may cause performance or rate-limit issues.

3. **react-colorful** – Previously caused black screen in production; reverted to simpler controlled picker.

---

## 14. Recommended Next Steps

### Must verify now
1. Confirm `profiles` has `last_seen`, `created_at`; add migrations if missing.

### Should clean up soon
1. Decide if `progress_color` should be per-profile and wire it, or remove from migrations.
2. Add error boundary around AdminDashboard.

### Safe to build on
1. Auth, UserProfile, hunt CRUD, progress bar, color picker (local).
2. New features that do not depend on `hunt_progress_events` or `profiles.progress_color`.

---

## 15. Copy/Paste Summary for ChatGPT

**App:** Shinny Tracker – Pokémon shiny-hunting progress tracker. React 18 + Vite + Supabase. Main flows: auth (Google), create/track hunts, +/− encounters, progress bar, color picker, accomplished view, admin dashboard.

**Current state (post-revert to checkpoint 0977329, post delta-cleanup):**
- Auth, profiles, hunt CRUD, progress +/−, progress bar, color picker work.
- Progress color is per-hunt, local state only; not stored in DB.
- **Reset tracking:** `insert_hunt_progress_event(p_hunt_id, p_reset_count)` – total count only. `reset_delta` is NOT used.
- Migrations add `profiles.progress_color` and `profiles.accent_color`; code does not use them.
- Daily Activity (Resets Today, Resets/Hour) was removed by revert.
- Presence uses `profiles.last_seen`; admin uses `profiles.last_active_at`, `profiles.created_at` – these may not exist.
- Admin dashboard polls 8+ queries every 30s.

**Supabase:** Tables: profiles, hunts, hunt_progress_events, admin_users, redeem_codes, redeemed_codes. RPC: insert_hunt_progress_event(p_hunt_id, p_reset_count). Storage: avatars.

**Next steps:** (1) Confirm profiles columns exist; (2) Optionally add error boundary for admin.

### Suspected Checkpoint Revert Damage (resolved)
- ~~RPC mismatch~~ – Resolved. App uses `p_reset_count` (total count); delta-based design removed.
- Daily Activity UI and `getDailyActivityStats` removed.
- `updateProfileProgressColor` and profile-level progress color removed.
- ProgressColorPicker simplified to controlled component; no Supabase persistence.
- `profiles.progress_color` and `profiles.accent_color` in migrations but unused in code.
