# Hard-Coded Email Audit: diazm.webdev@gmail.com

## Summary
Found hard-coded references to `diazm.webdev@gmail.com` in environment configuration files. The email is used for admin role assignment but **does NOT appear to be affecting auth, profile creation, or popup logic**.

## Files Found

### 1. `.env` (Line 4)
**Content:**
```env
VITE_ADMIN_EMAIL=diazm.webdev@gmail.com
```

**Purpose:** Environment variable for admin email configuration
**Impact:** Used to auto-grant admin role to this specific email

### 2. `.env.example` (Line 3)
**Content:**
```env
VITE_ADMIN_EMAIL=diazm.webdev@gmail.com
```

**Purpose:** Example/template file for environment variables
**Impact:** None (example file only)

### 3. `src/lib/auth.ts` (Lines 244-249, 296-309)
**Content:**
```typescript
// Auto-grant admin to specific email (development/admin setup)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
if (ADMIN_EMAIL && appUser.email === ADMIN_EMAIL && appUser.role !== 'admin') {
  appUser.role = 'admin'
  appUser.isAdmin = true
  // TODO: Update Supabase profile with admin role
}
```

**Purpose:** Auto-grants admin role if user's email matches `VITE_ADMIN_EMAIL`
**Impact:** Only affects admin role assignment, NOT auth flow or profile creation

## Areas Checked (No Hard-Coded Email Found)

### ✅ Auth Logic
- `src/context/AuthContext.tsx` - No email checks
- `src/lib/supabase/auth.ts` - No email checks
- `src/lib/supabase/client.ts` - No email checks
- Google sign-in flow - No email checks

### ✅ Profile Creation / Initialization
- `src/lib/supabase/auth.ts` → `ensureProfileExists()` - No email checks
- `src/lib/supabase/auth.ts` → `initializeUserProfile()` - No email checks
- `src/context/UserProfileContext.tsx` - No email checks
- Database trigger (`supabase_profile_trigger_fix.sql`) - No email checks

### ✅ Founder / First 151 Popup Logic
- `src/components/TrackerApp.tsx` → First 151 popup check - No email checks, uses `signup_number` and `badges`
- `src/components/First151CelebrationPopup.tsx` - No email checks
- `src/lib/supabase/auth.ts` → `initializeUserProfile()` - Assigns badge based on `signup_number`, not email

### ✅ Admin Checks
- `src/components/AdminGuard.tsx` - Uses `isAdmin()` which reads from env var (not hard-coded)
- `src/lib/adminData.ts` - No email checks

### ✅ Mock/Test Seed Data
- No seed data files found
- No test fixtures found

### ✅ Default Profile Loading
- `src/context/UserProfileContext.tsx` - Loads profile by user ID, no email checks
- `src/lib/supabase/auth.ts` → `getUserProfile()` - Queries by user ID, not email

### ✅ Achievements Logic
- `src/components/Achievements.tsx` - No email checks
- `src/components/AchievementBadge.tsx` - No email checks
- Badge assignment logic uses `signup_number`, not email

### ✅ localStorage / sessionStorage Fallbacks
- No hard-coded email in cache keys
- Cache keys use user IDs, not emails

### ✅ Route Guards
- `src/components/AdminGuard.tsx` - Uses env var (not hard-coded)
- No other route guards found

### ✅ Settings/Profile Page
- `src/components/AccountSettings.tsx` - No email checks

## Analysis

### What the Hard-Coded Email Does
The email `diazm.webdev@gmail.com` is only used for:
1. **Admin Role Assignment** - If a user signs in with this email, they automatically get admin role
2. **Environment Configuration** - Stored in `.env` file as `VITE_ADMIN_EMAIL`

### What It Does NOT Do
- ❌ Does NOT affect authentication flow
- ❌ Does NOT affect profile creation
- ❌ Does NOT affect First 151 popup logic
- ❌ Does NOT affect signup_number assignment
- ❌ Does NOT affect badge assignment
- ❌ Does NOT interfere with Google OAuth

### Potential Issue
The admin role assignment logic in `src/lib/auth.ts` has a TODO comment:
```typescript
// TODO: Update Supabase profile with admin role
```

This means:
- Admin role is set in localStorage/app state
- But NOT persisted to Supabase `profiles` table
- This could cause inconsistencies if the app relies on Supabase profile role

### Recommendation
The hard-coded email is **NOT causing auth/profile/popup issues** because:
1. It's only used for admin role assignment
2. The new auth flow uses Supabase, not the old `getCurrentUser()` function
3. Profile creation and popup logic don't check emails

However, if you want to remove the hard-coded reference:
1. Keep `VITE_ADMIN_EMAIL` in `.env` (it's fine as an env var)
2. Update `src/lib/auth.ts` to persist admin role to Supabase profile table
3. Or remove the auto-admin logic entirely and manage admin roles via database

## Conclusion
**No hard-coded email found in auth, profile, or popup logic.** The email only appears in environment configuration for admin role assignment and should not be causing sign-in issues.
