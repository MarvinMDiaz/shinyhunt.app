# Supabase Auth Flow Fix - Complete Summary

## Overview
Completely refactored the Supabase authentication flow to remove broken callback logic and fix session race conditions. The app now relies on Supabase's built-in session handling instead of fighting against it.

---

## 1. Supabase Client Configuration

**File:** `src/lib/supabase/client.ts`

**Status:** ✅ Already correct

- Uses `import.meta.env.VITE_SUPABASE_URL`
- Uses `import.meta.env.VITE_SUPABASE_ANON_KEY`
- Configured with:
  ```typescript
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
  ```

**No changes needed.**

---

## 2. Removed Broken Callback Logic

**File:** `src/pages/AuthCallback.tsx`

**Removed:**
- ❌ Polling loops (`pollSession()` with exponential backoff)
- ❌ `setTimeout` retry logic
- ❌ `exchangeCodeForSession()` manual code exchange
- ❌ Repeated `getUser()` or `getSession()` loops
- ❌ Manual URL hash/param parsing
- ❌ "Waiting for session" timeout logic (15 second timeout)
- ❌ Complex event handling with multiple retry paths

**Replaced with:**
- ✅ Simple session check using `supabase.auth.getSession()`
- ✅ Small delay (300ms) to allow Supabase to process URL
- ✅ Profile creation via `ensureProfileExists()` if needed
- ✅ Clean redirect logic

**New Implementation:**
```typescript
// Simple callback - no polling, no manual exchange
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  await ensureProfileExists(session.user.id)
  navigate('/tracker')
} else {
  navigate('/')
}
```

---

## 3. Google Sign-In Handler

**File:** `src/lib/supabase/auth.ts`

**Status:** ✅ Already correct

Uses official Supabase SDK:
```typescript
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

**No changes needed.**

---

## 4. Auth State Management

**File:** `src/hooks/useAuth.ts`

**Complete rewrite:**

**Before:**
- Used `getCurrentUser()` which mixed Supabase + localStorage
- No proper loading state
- Complex user loading logic

**After:**
- Direct Supabase session management
- Proper `isLoading` state
- Clean session/user state
- Listens to `onAuthStateChange` for real-time updates

**New Implementation:**
```typescript
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, user, isAuthenticated: !!session, isLoading, logout }
}
```

**Where auth state is restored:**
- `useAuth()` hook calls `supabase.auth.getSession()` on mount
- `onAuthStateChange` listener updates state on auth events

**Where auth state changes are listened to:**
- `useAuth()` hook sets up `onAuthStateChange` listener
- `UserProfileContext` also listens to auth changes to clear/load profile

---

## 5. Navbar Behavior

**File:** `src/components/TrackerApp.tsx`

**Fixed:**

**Before:**
- Used `!session` check (could be null during loading)
- Showed both logged-in and logged-out UI simultaneously

**After:**
- Uses `!isAuthenticated && !isLoadingAuth` for logged-out UI
- Uses `isAuthenticated` for logged-in UI
- Shows loading state while auth initializes
- Shows landing page if not authenticated

**Changes:**
```typescript
// Show loading while auth initializes
if (isLoadingAuth) {
  return <LoadingSpinner />
}

// Show landing page if not authenticated
if (!isAuthenticated) {
  return <LandingPage />
}

// Navbar buttons
{!isAuthenticated && !isLoadingAuth && (
  <LoginButton />
  <SignUpButton />
)}

{isAuthenticated && (
  <NavAvatar />
)}
```

---

## 6. Sign Out Fix

**File:** `src/lib/auth.ts`

**Updated `logout()` function:**

**Before:**
- Called `signOut()` then cleared all localStorage
- Didn't clear user-specific caches

**After:**
- Gets user ID before signing out
- Clears user-specific cache keys
- Clears generic cache keys
- Uses `signOut({ scope: "global" })` to clear OAuth cookies

**New Implementation:**
```typescript
export async function logout(): Promise<void> {
  try {
    // Get current user ID before signing out
    const { getSupabaseUser } = await import('@/lib/supabase/auth')
    const { user } = await getSupabaseUser()
    const userId = user?.id
    
    // Sign out from Supabase globally
    const { signOut } = await import('@/lib/supabase/auth')
    await signOut()
    
    // Clear user-specific caches
    clearUserSpecificCache(userId)
  } catch (error) {
    console.error('Error signing out:', error)
    clearUserSpecificCache()
  }
}
```

**Cache keys cleared:**
- `shinyhunt_avatar_url_${userId}` (user-specific)
- `shinyhunt_avatar_url` (generic)
- `shinyhunt_hunts_v2_${userId}` (user-specific)
- `shinyhunt_current_hunt_id_${userId}` (user-specific)
- `shinyhunt_hunts_v2` (generic)
- `shinyhunt_current_hunt_id` (generic)
- `shinyhunt_auth_user`
- `shinyhunt_auth_token`
- All sessionStorage

---

## 7. Account Switching / Cache Fix

**File:** `src/context/UserProfileContext.tsx`

**Fixed cache keys:**

**Before:**
- Used generic `shinyhunt_avatar_url` key
- No user-specific caching
- Old user's avatar could show for new user

**After:**
- Uses `shinyhunt_avatar_url_${userId}` for user-specific cache
- Clears old user's cache when user changes
- Detects user change and clears profile immediately

**Changes:**
```typescript
// User-specific cache key
const getAvatarCacheKey = (userId?: string | null) => {
  return userId ? `shinyhunt_avatar_url_${userId}` : 'shinyhunt_avatar_url'
}

// Detect user change
if (currentUserId && userIdToUse !== currentUserId) {
  console.log('[UserProfileContext] User changed, clearing old profile')
  setProfile(null)
  localStorage.removeItem(getAvatarCacheKey(currentUserId))
}
```

**Cache keys changed:**
- ✅ `shinyhunt_avatar_url` → `shinyhunt_avatar_url_${userId}` (user-specific)
- ✅ Old user's cache cleared when user changes
- ✅ Profile state reset when user changes

---

## 8. Data Fetching Safety

**Files:** `src/lib/supabase/auth.ts`, `src/context/UserProfileContext.tsx`

**Ensured user-specific queries:**

- ✅ `getUserProfile(userId)` - filters by user ID
- ✅ Profile loading clears when user changes
- ✅ Hunt data should be filtered by `user_id` (when moved to database)

**User change detection:**
- `UserProfileContext` detects when `userId` changes
- Clears old profile immediately
- Loads new user's profile

---

## 9. Cleanup

**Removed:**
- ❌ Broken callback polling logic
- ❌ Manual code exchange logic
- ❌ Timeout loops
- ❌ Complex event handling in callback
- ❌ Duplicate session restoration logic

**Kept:**
- ✅ Profile creation logic (`ensureProfileExists`)
- ✅ Profile initialization (`initializeUserProfile`)
- ✅ Existing UI design
- ✅ All hunt tracking functionality

---

## Files Modified

1. **`src/pages/AuthCallback.tsx`** - Complete rewrite
   - Removed: All polling, timeouts, manual code exchange
   - Added: Simple session check + profile creation

2. **`src/hooks/useAuth.ts`** - Complete rewrite
   - Removed: localStorage fallback, complex user loading
   - Added: Direct Supabase session management with loading state

3. **`src/lib/auth.ts`** - Updated logout
   - Added: `clearUserSpecificCache()` function
   - Updated: `logout()` to clear user-specific caches

4. **`src/context/UserProfileContext.tsx`** - Updated cache keys
   - Changed: Avatar cache to be user-specific
   - Added: User change detection and cache clearing

5. **`src/components/TrackerApp.tsx`** - Updated to use new auth hook
   - Changed: Uses `useAuth()` hook instead of direct session state
   - Added: Loading state handling
   - Updated: Navbar to use `isAuthenticated` and `isLoadingAuth`
   - Updated: Data loading to only run when authenticated

---

## Files Not Modified (Already Correct)

1. **`src/lib/supabase/client.ts`** - Already correct
2. **`src/lib/supabase/auth.ts`** - Google sign-in already correct

---

## Testing Checklist

- [ ] Sign in with Google → Should redirect to `/tracker` without timeout
- [ ] Sign out → Should clear all caches and redirect to `/`
- [ ] Switch accounts → Should clear old user's data and load new user's data
- [ ] Navbar → Should show correct UI based on auth state
- [ ] Profile creation → Should create profile in Supabase after sign-in
- [ ] Avatar caching → Should cache per user, clear on user change
- [ ] Hunt data → Should load only for authenticated user

---

## Key Improvements

1. **No more race conditions** - Relies on Supabase's built-in session handling
2. **No more timeouts** - Simple session check, no polling
3. **Proper loading states** - App waits for auth before rendering
4. **User-specific caching** - Prevents data leakage between users
5. **Clean logout** - Properly clears all user-specific data
6. **Account switching** - Detects user change and clears old data

---

## Next Steps (Optional)

1. **Move hunt data to database** - Currently still in localStorage
2. **Add user_id to hunts** - When moving to database, ensure hunts are user-specific
3. **Add RLS policies** - Ensure database queries are user-scoped
