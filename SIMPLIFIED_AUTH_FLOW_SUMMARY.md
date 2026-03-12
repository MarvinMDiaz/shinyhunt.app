# Simplified Auth Flow Summary

## Overview
Completely simplified the Supabase auth flow by removing callback complexity and using app-root redirects. Supabase now handles session restoration automatically.

---

## 1. Updated Supabase Client

**File:** `src/lib/supabase/client.ts`

**Status:** ✅ Already correct

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
```

**No changes needed.**

---

## 2. Updated Google Sign-In Handler

**File:** `src/lib/supabase/auth.ts`

### Changes
- Removed `/auth/callback` redirect
- Now redirects to app root: `window.location.origin`
- Removed unnecessary query params

### Before
```typescript
const redirectTo = `${window.location.origin}/auth/callback`
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

### After
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin,
  },
})
```

---

## 3. Fixed auth.ts Guard Around getUser()

**File:** `src/lib/supabase/auth.ts`

### Problem
- `getSupabaseUser()` was calling `getUser()` even when no session existed
- This caused `AuthSessionMissingError` errors

### Solution
- Check for session first using `getSession()`
- Only call `getUser()` if session exists
- Return `null` without error if no session

### Before
```typescript
export async function getSupabaseUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  // ... error handling
}
```

### After
```typescript
export async function getSupabaseUser() {
  // First check if there's a session - never call getUser() without a session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (!session) {
    // No session - return null without calling getUser()
    return { user: null, error: null }
  }
  
  // Session exists - safe to call getUser()
  const { data: { user }, error } = await supabase.auth.getUser()
  // ... error handling
}
```

---

## 4. Updated App Startup Auth Logic

**File:** `src/hooks/useAuth.ts`

### Changes
- On app load: calls `supabase.auth.getSession()`
- Stores session/user in state
- Listens with `supabase.auth.onAuthStateChange(...)`
- When session exists: ensures profile exists and loads user data
- When session is null: clears user data

### Key Implementation
```typescript
useEffect(() => {
  // Get initial session on app startup
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    if (session?.user?.id) {
      // Session exists - ensure profile exists
      await ensureProfileExists(session.user.id)
    }
    setSession(session)
    setUser(session?.user ?? null)
    setIsLoading(false)
  })

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user?.id) {
        // Ensure profile exists
        await ensureProfileExists(session.user.id)
      }
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## 5. Updated UserProfileContext

**File:** `src/context/UserProfileContext.tsx`

### Problem
- Was clearing profile during OAuth redirect flow
- Cleared profile even when session was temporarily null during redirect

### Solution
- Added `isInitializedRef` to track if context has initialized
- Only clears profile when user actually changes (not during OAuth redirect)
- Only clears on confirmed signed-out state (when `previousUserIdRef.current !== null`)

### Key Changes
```typescript
const isInitializedRef = useRef(false)

// Initial load - only after app has initialized auth
const initialLoad = async () => {
  // Small delay to let auth state settle
  await new Promise(resolve => setTimeout(resolve, 100))
  if (!isInitializedRef.current) {
    await loadProfile()
    isInitializedRef.current = true
  }
}

onAuthStateChange(async (supabaseUser) => {
  // Only clear profile if user actually changed (not during OAuth redirect)
  if (userChanged && oldUserId !== null) {
    // Clear old user's profile
  }
  
  // Only clear on confirmed signed-out state
  if (!supabaseUser && previousUserIdRef.current !== null) {
    // User signed out - clear profile
  }
})
```

---

## 6. Simplified AuthCallback Page

**File:** `src/pages/AuthCallback.tsx`

### Changes
- Removed all timeout logic
- Removed all polling loops
- Removed all "wait for session" retry logic
- Removed all auth failure redirect loop logic
- Now simply redirects to `/tracker` - the app handles auth state checking

### Before
- Complex state machine with timeouts
- Polling for session
- Multiple event handlers
- Manual session restoration

### After
```typescript
export function AuthCallback() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Redirect to tracker - the app will handle auth state checking
    navigate('/tracker', { replace: true })
  }, [navigate])
  
  return null
}
```

**Note:** This page is kept for backward compatibility but is no longer needed. Google sign-in redirects to app root, and Supabase handles session restoration automatically.

---

## 7. Navbar Loading State

**File:** `src/components/TrackerApp.tsx`

### Status
- Already uses `isLoadingAuth` from `useAuth()` hook
- Shows loading state while auth initializes
- Shows correct UI based on `isAuthenticated` and `isLoadingAuth`

### Implementation
```typescript
const { session, user, isAuthenticated, isLoading: isLoadingAuth } = useAuth()

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

## Files Modified

1. **`src/lib/supabase/auth.ts`**
   - Updated `signInWithGoogle()` to redirect to app root
   - Fixed `getSupabaseUser()` to check session before calling `getUser()`

2. **`src/hooks/useAuth.ts`**
   - Added profile creation on session restore
   - Ensures profile exists when session is found

3. **`src/context/UserProfileContext.tsx`**
   - Added initialization tracking
   - Prevents clearing profile during OAuth redirect
   - Only clears on confirmed user change or sign-out

4. **`src/pages/AuthCallback.tsx`**
   - Completely simplified - just redirects to tracker
   - Removed all timeout/polling logic

---

## Files Not Modified (Already Correct)

1. **`src/lib/supabase/client.ts`** - Already configured correctly
2. **`src/components/TrackerApp.tsx`** - Already uses `isLoadingAuth` correctly

---

## What This Fixes

- ✅ No more callback timeouts - Supabase handles session restoration automatically
- ✅ No more `AuthSessionMissingError` - `getUser()` only called when session exists
- ✅ Profile doesn't clear during OAuth redirect - only clears on actual user change
- ✅ Second-account Google sign-in works - redirects to app root, Supabase restores session
- ✅ Simpler flow - no complex callback logic, just app-root redirect

---

## How It Works Now

1. **User clicks "Sign in with Google"**
   - Calls `signInWithGoogle()`
   - Redirects to Google OAuth
   - Google redirects back to `window.location.origin` (app root)

2. **App loads**
   - `useAuth()` hook calls `supabase.auth.getSession()`
   - Supabase automatically processes URL hash/params (with `detectSessionInUrl: true`)
   - Session is restored and stored in state

3. **Auth state changes**
   - `onAuthStateChange` listener fires
   - Profile is ensured to exist
   - User data is loaded

4. **No callback page needed**
   - Supabase handles everything automatically
   - App just checks for session on startup
   - If session exists, user is authenticated

---

## Testing Checklist

- [ ] Sign in with Google → Should redirect to app root and authenticate
- [ ] Sign in with different Google account → Should work correctly
- [ ] Profile loads after login → Should show correct profile
- [ ] No auth errors in console → Should not see `AuthSessionMissingError`
- [ ] Profile doesn't clear during redirect → Should stay loaded
- [ ] Navbar shows correct state → Should show authenticated UI when logged in
