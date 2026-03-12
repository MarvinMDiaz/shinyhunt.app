# Auth Flow Rebuild Summary

## Overview
Completely rebuilt the authentication flow from scratch with a clean, simple architecture. Removed all broken callback complexity and replaced with a straightforward Supabase-based auth system.

---

## Files Deleted

1. **`src/hooks/useAuth.ts`** - Removed old auth hook, replaced with AuthContext

---

## Files Created

1. **`src/context/AuthContext.tsx`** - New clean auth context/provider
   - Manages session/user state
   - Handles Google sign-in
   - Handles sign-out with cache clearing
   - Ensures profile exists on sign-in
   - Listens to auth state changes

---

## Files Modified

### 1. `src/lib/supabase/client.ts`
**Changes:**
- Simplified to minimal configuration
- Uses `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`
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

### 2. `src/lib/supabase/auth.ts`
**Changes:**
- Removed all broken/complex auth code
- Kept only essential functions:
  - `signInWithGoogle()` - Simple OAuth redirect
  - `signOut()` - Global sign-out
  - `getSupabaseUser()` - Safe user fetching (checks session first)
  - `getUserProfile()` - Profile fetching
  - `ensureProfileExists()` - Profile creation
  - `updateProfileAvatar()` - Avatar updates
  - `initializeUserProfile()` - Profile initialization
  - `markFirst151PopupSeen()` - Popup tracking

### 3. `src/context/UserProfileContext.tsx`
**Changes:**
- Now uses `useAuth()` from AuthContext instead of direct Supabase calls
- Simplified profile loading logic
- Loads profile when user is authenticated
- Clears profile when user signs out
- Removed complex user change detection logic

### 4. `src/main.tsx`
**Changes:**
- Wrapped app with `AuthProvider` before `UserProfileProvider`
- Ensures auth state is available to all components

### 5. `src/components/TrackerApp.tsx`
**Changes:**
- Updated to use `useAuth()` from AuthContext
- Changed `isLoadingAuth` to `loadingAuth`
- Removed `session` usage (uses `user` directly)
- Simplified logout handler to use `signOut()` from auth context
- Updated navbar to use `loadingAuth` properly
- Removed broken session checking logic

### 6. `src/pages/AuthCallback.tsx`
**Changes:**
- Completely simplified - just redirects to `/tracker`
- No timeout logic, no polling, no session checking
- Supabase handles session restoration automatically

---

## New Auth Flow

### 1. Startup Session Restoration
**Location:** `src/context/AuthContext.tsx`

```typescript
useEffect(() => {
  // Get initial session on app startup
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    if (session?.user?.id) {
      await ensureProfileExists(session.user.id)
    }
    setSession(session)
    setUser(session?.user ?? null)
    setLoadingAuth(false)
  })

  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user?.id) {
        await ensureProfileExists(session.user.id)
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoadingAuth(false)
    }
  )
}, [])
```

**What happens:**
- On app load, checks for existing session
- If session exists, ensures profile exists
- Sets session/user state
- Listens to auth state changes
- Updates state when auth changes

### 2. Google Sign-In
**Location:** `src/lib/supabase/auth.ts` → `signInWithGoogle()`

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin,
  },
})
```

**What happens:**
- User clicks "Sign in with Google"
- Redirects to Google OAuth
- Google redirects back to app root
- Supabase automatically processes URL hash/params (via `detectSessionInUrl: true`)
- `onAuthStateChange` fires with new session
- Profile is ensured to exist
- User data is loaded

### 3. Sign-Out
**Location:** `src/context/AuthContext.tsx` → `handleSignOut()`

```typescript
const handleSignOut = async () => {
  await supabaseSignOut() // Calls signOut({ scope: 'global' })
  clearAuthCache() // Clears localStorage/sessionStorage
  setSession(null)
  setUser(null)
}
```

**What happens:**
- Calls `supabase.auth.signOut({ scope: 'global' })`
- Clears all cached data (profile, avatar, hunts, shiny_results)
- Clears session/user state
- `onAuthStateChange` fires with null session
- Profile is cleared
- User is redirected to home

### 4. User Data Loading
**Location:** `src/context/UserProfileContext.tsx`

```typescript
useEffect(() => {
  if (loadingAuth) return

  if (isAuthenticated && user?.id) {
    loadProfile(user.id) // Fetches profile from Supabase
  } else {
    setProfile(null)
    setLoadingProfile(false)
  }
}, [isAuthenticated, user?.id, loadingAuth])
```

**What happens:**
- After session is confirmed, profile is loaded
- Profile includes: avatar, username, badges, signup_number, etc.
- Avatar is cached in localStorage for instant render
- When user signs out, profile is cleared

**Future:** When hunts/shiny_results move to Supabase, add loading here:
```typescript
if (isAuthenticated && user?.id) {
  await loadProfile(user.id)
  await loadHunts(user.id) // TODO: Add when hunts move to Supabase
  await loadShinyResults(user.id) // TODO: Add when shiny_results move to Supabase
}
```

### 5. Navbar Rendering
**Location:** `src/components/TrackerApp.tsx`

```typescript
const { user, isAuthenticated, loadingAuth } = useAuth()

// Show loading while auth initializes
if (loadingAuth) {
  return <LoadingSpinner />
}

// Show landing page if not authenticated
if (!isAuthenticated) {
  return <LandingPage />
}

// Navbar buttons
{!isAuthenticated && !loadingAuth && (
  <LoginButton />
  <SignUpButton />
)}

{isAuthenticated && (
  <NavAvatar />
)}
```

**What happens:**
- While `loadingAuth` is true, shows loading spinner
- Once auth is resolved:
  - If not authenticated: shows Login/Create Account buttons
  - If authenticated: shows authenticated navbar (avatar, settings, etc.)
- No flashing of wrong auth state

---

## Safety Guards

### Never Call getUser() Without Session
**Location:** `src/lib/supabase/auth.ts` → `getSupabaseUser()`

```typescript
export async function getSupabaseUser() {
  // Check for session first
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { user: null, error: null } // Don't call getUser()
  }
  
  // Session exists - safe to call getUser()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, error: null }
}
```

**Prevents:** `AuthSessionMissingError` when there's no session

---

## Key Improvements

1. **Simple Architecture** - Single AuthContext manages all auth state
2. **No Callback Complexity** - Supabase handles session restoration automatically
3. **Clean Separation** - Auth logic separate from profile logic
4. **Proper Loading States** - Navbar doesn't flash wrong state
5. **Safe User Fetching** - Never calls getUser() without session
6. **Automatic Profile Creation** - Profile ensured on sign-in
7. **Cache Clearing** - Sign-out clears all user-specific data
8. **Future-Ready** - Easy to add hunts/shiny_results loading when moved to Supabase

---

## Testing Checklist

- [ ] App startup → Session restored if exists
- [ ] Google sign-in → Redirects to app root, session restored
- [ ] Sign-out → Clears all caches, redirects to home
- [ ] Navbar → Shows correct UI based on auth state
- [ ] Profile loading → Loads after sign-in
- [ ] Account switching → Clears old data, loads new data
- [ ] No auth errors → No `AuthSessionMissingError` in console

---

## Next Steps (Future)

1. **Move hunts to Supabase** - Add `loadHunts(userId)` in UserProfileContext
2. **Move shiny_results to Supabase** - Add `loadShinyResults(userId)` in UserProfileContext
3. **Add RLS policies** - Ensure database queries are user-scoped
