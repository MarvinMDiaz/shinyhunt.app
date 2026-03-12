# Auth Callback & Data Loading Fix Summary

## Overview
Fixed the Supabase auth callback to properly wait for session restoration and ensured user data loads correctly after login and account switching.

---

## 1. Fixed /auth/callback Page

**File:** `src/pages/AuthCallback.tsx`

### Problem
- Was checking `getSession()` immediately with only 300ms delay
- Redirected to home if session was null on first check
- Didn't wait for Supabase to restore session from OAuth redirect
- Different Google accounts failed because session wasn't restored yet

### Solution
- Uses `supabase.auth.onAuthStateChange()` to wait for auth events
- Handles `INITIAL_SESSION` event (fires when Supabase processes URL and restores session)
- Handles `SIGNED_IN` event (fires when new session established)
- Handles `TOKEN_REFRESHED` event (fires when session refreshed)
- Only redirects to home after 8-second timeout if no session found
- Checks for auth params in URL to distinguish callback from real sign-out

### Key Changes
```typescript
// Listen to auth state changes - primary method
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    // INITIAL_SESSION - Supabase has processed URL and restored session
    if (event === 'INITIAL_SESSION' && session?.user?.id) {
      await handleSuccess(session)
      return
    }
    
    // SIGNED_IN - new session established
    if (event === 'SIGNED_IN' && session?.user?.id) {
      await handleSuccess(session)
      return
    }
    
    // ... other events
  }
)

// Also check for existing session (in case already restored)
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user?.id && !hasHandledCallback.current) {
    handleSuccess(session)
  }
  // Don't fail if null - wait for onAuthStateChange
})
```

### Timeout
- 8-second fallback timeout (was 15 seconds, but 8 is sufficient)
- Only triggers if no session found after waiting for auth events
- Prevents infinite loading

---

## 2. Supabase Client Configuration

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

## 3. Fixed Data Loading After Login

**File:** `src/components/TrackerApp.tsx`

### Problem
- Data loading only happened on mount
- Didn't reload when user changed
- Could show old user's data when switching accounts

### Solution
- Tracks previous user ID with `useRef`
- Detects user changes
- Clears old user's data immediately when user changes
- Loads fresh data for new/current user
- Only loads data when authenticated

### Key Changes
```typescript
const previousUserIdRef = useRef<string | null>(null)

useEffect(() => {
  if (isLoadingAuth) return
  
  const currentUserId = user?.id ?? null
  const previousUserId = previousUserIdRef.current
  const userChanged = previousUserId !== currentUserId

  if (userChanged && currentUserId) {
    // Clear old user's data immediately
    if (previousUserId !== null) {
      setState({ hunts: [], currentHuntId: null, history: [], ... })
    }
    
    // Load fresh data for new user
    previousUserIdRef.current = currentUserId
    loadUserData()
  }
  
  // Handle logout
  if (!isAuthenticated && previousUserId !== null) {
    setState({ hunts: [], currentHuntId: null, history: [], ... })
    previousUserIdRef.current = null
  }
}, [isAuthenticated, isLoadingAuth, user?.id])
```

### Where Fresh User Data is Fetched
- **Profile:** `UserProfileContext` loads profile when user changes
- **Hunts:** `TrackerApp` loads hunts from localStorage when user changes
- **Future:** When hunts move to Supabase, fetch here:
  ```typescript
  const { data: hunts } = await supabase
    .from('hunts')
    .select('*')
    .eq('user_id', currentUserId)
  ```

---

## 4. Fixed State Reset on Logout/Account Switch

**File:** `src/components/TrackerApp.tsx` & `src/context/UserProfileContext.tsx`

### Problem
- State didn't reset when user changed
- Old user's profile/hunts could show for new user

### Solution
- Both components track previous user ID
- Clear state immediately when user changes
- Load fresh data for new user

### TrackerApp (Hunt Data)
```typescript
// Clear old user's data immediately
if (previousUserId !== null && userChanged) {
  setState({
    hunts: [],
    currentHuntId: null,
    history: [],
    darkMode: state.darkMode, // Preserve preferences
    theme: state.theme,
  })
}
```

### UserProfileContext (Profile Data)
```typescript
// Clear old user's profile and cache
if (oldUserId && userChanged) {
  setProfile(null)
  localStorage.removeItem(getAvatarCacheKey(oldUserId))
}
```

### Where User State is Reset
1. **On Logout:** 
   - `TrackerApp` clears hunt state when `!isAuthenticated`
   - `UserProfileContext` clears profile when user is null
   - `logout()` function clears all caches

2. **On Account Switch:**
   - `TrackerApp` detects user change and clears hunts
   - `UserProfileContext` detects user change and clears profile
   - Both load fresh data for new user

---

## 5. Profile Loading After Login

**File:** `src/context/UserProfileContext.tsx`

### Changes
- Tracks previous user ID to detect changes
- Clears old user's profile immediately when user changes
- Loads fresh profile for new user
- Clears cache when user changes

```typescript
const previousUserIdRef = useRef<string | null>(null)

onAuthStateChange(async (supabaseUser) => {
  const newUserId = supabaseUser?.id ?? null
  const oldUserId = previousUserIdRef.current
  const userChanged = oldUserId !== newUserId

  if (userChanged && newUserId) {
    // Clear old user's profile
    if (oldUserId) {
      setProfile(null)
      localStorage.removeItem(getAvatarCacheKey(oldUserId))
    }
    
    // Load new user's profile
    previousUserIdRef.current = newUserId
    await loadProfile(newUserId)
  }
})
```

---

## Files Modified

1. **`src/pages/AuthCallback.tsx`** - Complete rewrite
   - Uses `onAuthStateChange` to wait for session restoration
   - Handles `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` events
   - 8-second fallback timeout
   - Doesn't immediately redirect to home if session is null

2. **`src/components/TrackerApp.tsx`** - Updated data loading
   - Tracks previous user ID
   - Detects user changes
   - Clears old user's data immediately
   - Loads fresh data for new user

3. **`src/context/UserProfileContext.tsx`** - Updated profile loading
   - Tracks previous user ID
   - Detects user changes
   - Clears old user's profile immediately
   - Loads fresh profile for new user
   - Added `useRef` import

---

## Files Not Modified (Already Correct)

1. **`src/lib/supabase/client.ts`** - Already configured correctly

---

## Testing Checklist

- [ ] Sign in with first Google account → Should redirect to `/tracker` without timeout
- [ ] Sign out → Should clear all data and redirect to `/`
- [ ] Sign in with different Google account → Should clear old data, load new user's data
- [ ] Switch accounts → Should clear old user's profile/hunts, load new user's data
- [ ] Profile loads after login → Should show correct profile for logged-in user
- [ ] Hunt data loads after login → Should show correct hunts for logged-in user
- [ ] No data leakage → Old user's data shouldn't show for new user

---

## Key Improvements

1. **No more premature redirects** - Waits for Supabase to restore session
2. **Proper event handling** - Uses `onAuthStateChange` instead of polling
3. **Account switching works** - Detects user changes and clears old data
4. **Fresh data loading** - Loads user-specific data after login/switch
5. **State reset** - Clears state immediately when user changes
6. **No data leakage** - Old user's data cleared before loading new user's data

---

## Next Steps (Future)

1. **Move hunts to Supabase** - Currently in localStorage, should move to database
2. **Add user_id filtering** - When hunts move to Supabase, ensure queries are user-scoped
3. **Add RLS policies** - Ensure database queries are user-scoped at database level
