import { useState, useEffect, useRef } from 'react'
import { Plus, LogIn, UserPlus, Loader2, MoreVertical, BookOpen } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HuntSwitcher } from '@/components/HuntSwitcher'
import { CreateHuntDialog } from '@/components/CreateHuntDialog'
import { RenameHuntDialog } from '@/components/RenameHuntDialog'
import { DeleteHuntDialog } from '@/components/DeleteHuntDialog'
import { CompleteHuntDialog } from '@/components/CompleteHuntDialog'
import { ResetHuntDialog, ResetType, ResetOptions } from '@/components/ResetHuntDialog'
import { HuntDetails } from '@/components/HuntDetails'
import { ProgressPanelV3 } from '@/components/ProgressPanelV3'
import { AccomplishedView } from '@/components/AccomplishedView'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { ThemeSelector } from '@/components/ThemeSelector'
import { FloatingSparkles } from '@/components/FloatingSparkles'
import { TrackerBackground } from '@/components/TrackerBackground'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AccountSettings } from '@/components/AccountSettings'
import { NavAvatar } from '@/components/NavAvatar'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Palette } from 'lucide-react'
import { themes } from '@/lib/themes'
import { storageService, initializeStorageService } from '@/lib/storageService'
import { savePreferences } from '@/lib/preferencesStorage'
import { Hunt, AppState, HistoryEntry } from '@/types'
import { initializeUserProfile } from '@/lib/supabase/auth'
import { useUserProfile } from '@/context/UserProfileContext'
import { useAuth } from '@/context/AuthContext'
import { First151CelebrationPopup } from '@/components/First151CelebrationPopup'
import { SEO } from '@/components/SEO'
import { logger } from '@/lib/logger'

const isDev = import.meta.env.DEV

export function TrackerApp() {
  // Initialize with empty state - will load from Supabase when authenticated
  const [state, setState] = useState<AppState>({
    hunts: [],
    currentHuntId: null,
    darkMode: false,
    theme: 'default',
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated, loadingAuth, signOut } = useAuth()
  const { loadingProfile, refreshProfile } = useUserProfile()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Track previous user ID to detect user changes
  const previousUserIdRef = useRef<string | null>(null)

  // Load user data when authenticated and handle user changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (loadingAuth) {
      return
    }

    const currentUserId = user?.id ?? null
    const previousUserId = previousUserIdRef.current

    // User logged out - clear state
    if (!isAuthenticated || !currentUserId) {
      if (previousUserId !== null) {
        // User was logged in before, now logged out - clear everything
        setState({
          hunts: [],
          currentHuntId: null,
          darkMode: state.darkMode, // Preserve dark mode preference
          theme: state.theme, // Preserve theme preference
        })
        setIsLoading(false)
        previousUserIdRef.current = null
      }
      return
    }

    // User is authenticated
    const userChanged = previousUserId !== currentUserId

    if (userChanged) {

      // Clear old user's data immediately
      if (previousUserId !== null) {
        setState({
          hunts: [],
          currentHuntId: null,
          darkMode: state.darkMode,
          theme: state.theme,
        })
      }

      // Update ref
      previousUserIdRef.current = currentUserId

      // Load fresh data for the new/current user
      setIsLoading(true)
      
      async function loadUserData() {
        try {
          
          // Initialize storage service with Supabase adapter (if authenticated)
          await initializeStorageService()
          
          // Check for legacy data and migrate if needed (only on first load)
          if (previousUserId === null && storageService.hasLegacyData()) {
            const legacyHunts = storageService.loadLegacyData()
            if (legacyHunts && legacyHunts.length > 0) {
              // Migrate hunts to Supabase
              for (const hunt of legacyHunts) {
                try {
                  const existing = await storageService.getHuntById(hunt.id)
                  if (!existing) {
                    await storageService.createHunt(hunt)
                  }
                } catch (migrateError) {
                  logger.error('Failed to migrate hunt')
                }
              }
            }
          }
          
          // Load hunts from Supabase (via storageService)
          const hunts = await storageService.getAllHunts()
          const currentHuntId = await storageService.getCurrentHuntId()
          
          // Load preferences from localStorage (theme, darkMode)
          const { loadPreferences } = await import('@/lib/preferencesStorage')
          const preferences = loadPreferences()
          
          const loadedState = {
            hunts,
            currentHuntId,
            darkMode: preferences.darkMode,
            theme: preferences.theme,
          }
          
          setState(loadedState)
          setIsLoading(false)
        } catch (error) {
          logger.error('Failed to load user data')
          setIsLoading(false)
        }
      }

      loadUserData()
    }
  }, [isAuthenticated, loadingAuth, user?.id])

  // Initialize profile for new users and check for First 151 popup
  // Use a ref to track if initialization has already run to prevent loops
  const initializationRunRef = useRef(false)
  const { profile } = useUserProfile()
  
  useEffect(() => {
    const initializeProfileAndCheckPopup = async () => {
      // Wait for auth to be loaded and user to be available
      if (loadingAuth || !user?.id) {
        return
      }
      
      // Prevent multiple runs - only initialize once per session
      if (initializationRunRef.current) {
        return
      }
      
      // Wait for initial profile load to complete (but don't depend on loadingProfile in deps)
      // Check if profile exists instead
      if (!profile && loadingProfile) {
        return
      }

      // Mark as run to prevent re-execution
      initializationRunRef.current = true

      try {
        // Initialize profile if needed (assigns signup_number and badges for new users)
        // This is idempotent - safe to call multiple times
        const initResult = await initializeUserProfile(user.id)
        
        if (initResult.error) {
          logger.error('Error initializing profile')
        }
        
        // Refresh profile context to get updated signup_number and badges
        // Skip loading state to prevent UI flicker/blinking
        await refreshProfile(true)
        
        // Wait a moment for profile context to update
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Re-fetch profile directly to ensure we have the latest data
              const { getUserProfile } = await import('@/lib/supabase/auth')
              const { profile: updatedProfile, error: fetchError } = await getUserProfile(user.id)
        
        if (fetchError) {
          logger.error('Error fetching updated profile')
        }
        
        // Check if user should see First 151 popup
        if (updatedProfile) {
          const signupNumber = updatedProfile.signup_number
          // Explicitly check for boolean true (handle string "true" or boolean true)
          const founderBadge = updatedProfile.founder_badge === true || updatedProfile.founder_badge === 'true'
          const founderPopupShown = updatedProfile.founder_popup_shown === true || updatedProfile.founder_popup_shown === 'true'
          
          // Show popup if:
          // 1. User has founder_badge = true
          // 2. User hasn't seen the popup yet (founder_popup_shown = false)
          const shouldShowPopup = founderBadge === true && founderPopupShown === false
          
          if (shouldShowPopup) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
              setShowFirst151Popup(true)
            }, 500)
          }
        }
      } catch (error) {
        logger.error('Error initializing profile or checking popup')
        // Reset ref on error so it can retry
        initializationRunRef.current = false
      }
    }

    initializeProfileAndCheckPopup()
    // Only depend on user.id - don't depend on loadingProfile or refreshProfile
    // to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  
  // Reset initialization ref when user changes
  useEffect(() => {
    initializationRunRef.current = false
  }, [user?.id])

  // Check for founder popup when profile is loaded from context
  // This runs separately from initialization to catch profile updates
  const popupCheckedRef = useRef(false)
  useEffect(() => {
    // Skip if already checked popup for this user
    if (popupCheckedRef.current || !user?.id || !isAuthenticated || loadingProfile) {
      return
    }

    // Only check if profile exists and has founder fields
    if (!profile) {
      return
    }

    const signupNumber = profile.signup_number
    // Explicitly check for boolean true (handle string "true" or boolean true)
    const founderBadge = profile.founder_badge === true || 
                         (typeof profile.founder_badge === 'string' && profile.founder_badge === 'true')
    const founderPopupShown = profile.founder_popup_shown === true || 
                              (typeof profile.founder_popup_shown === 'string' && profile.founder_popup_shown === 'true')

    // Show popup if:
    // 1. User has founder_badge = true
    // 2. User hasn't seen the popup yet (founder_popup_shown = false)
    const shouldShowPopup = founderBadge === true && founderPopupShown === false

    if (shouldShowPopup) {
      popupCheckedRef.current = true
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setShowFirst151Popup(true)
      }, 500)
    } else {
      // Mark as checked even if not showing popup
      popupCheckedRef.current = true
    }
  }, [profile, user?.id, isAuthenticated, loadingProfile])

  // Reset popup check ref when user changes
  useEffect(() => {
    popupCheckedRef.current = false
  }, [user?.id])

  // Listen for tab switch event from celebration popup
  useEffect(() => {
    const handleSwitchToAchievements = () => {
      setActiveTab('accomplished')
      // Small delay to ensure AccomplishedView is mounted, then switch to achievements tab
      setTimeout(() => {
        const event = new CustomEvent('switchToAchievementsTab')
        window.dispatchEvent(event)
      }, 300)
    }

    window.addEventListener('switchToAchievements', handleSwitchToAchievements)
    return () => {
      window.removeEventListener('switchToAchievements', handleSwitchToAchievements)
    }
  }, [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [renameHuntId, setRenameHuntId] = useState<string | null>(null)
  const [deleteHuntId, setDeleteHuntId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  // resetSnapshot removed - undo functionality not currently implemented
  const [showLandingPage, setShowLandingPage] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [showFirst151Popup, setShowFirst151Popup] = useState(false)
  const { toast } = useToast()

  // Handle logout - comprehensive cleanup
  const handleLogout = async () => {
    try {
      // Clear application state first
        setState({
          hunts: [],
          currentHuntId: null,
          darkMode: state.darkMode,
          theme: state.theme,
        })
      
      // Sign out from Supabase (this will clear caches via AuthContext)
      await signOut()
      
      // Navigate to home
      navigate('/', { replace: true })
    } catch (error) {
      logger.error('Error during logout')
      // Still navigate to home even if sign out fails
      navigate('/', { replace: true })
    }
  }

  // Apply dark mode
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [state.darkMode])

  // Save hunts to Supabase whenever they change
  useEffect(() => {
    if (isLoading) {
      return // Don't save during initial load
    }
    
    if (!isAuthenticated) {
      return // Don't save if not authenticated
    }
    
    async function saveData() {
      try {
        // Save hunts directly to Supabase via storageService
        const { saveState } = await import('@/lib/storage')
        await saveState(state)
      } catch (error) {
        logger.error('saveData failed')
        
        // Extract detailed error information
        let errorMessage = 'Unknown error'
        let errorDetails = ''
        
        if (error instanceof Error) {
          errorMessage = error.message
          errorDetails = error.stack || ''
        } else if (error && typeof error === 'object') {
          // Handle Supabase errors or other object errors
          const err = error as any
          if (err.message) {
            errorMessage = err.message
          } else if (err.error?.message) {
            errorMessage = err.error.message
            errorDetails = `Code: ${err.error.code || 'N/A'}, Hint: ${err.error.hint || 'N/A'}`
          } else if (err.code) {
            errorMessage = `Error code: ${err.code}`
            errorDetails = err.message || err.hint || ''
          } else {
            errorMessage = JSON.stringify(error)
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        // Don't show error toast for "Pokémon must be selected" - hunt will be saved when Pokémon is selected
        if (errorMessage.includes('Pokémon must be selected') || errorMessage.includes('Pokémon not selected')) {
          return
        }
        
        toast({
          title: 'Save error',
          description: `Failed to save data: ${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`,
          variant: 'destructive',
        })
      }
    }
    
    saveData()
  }, [state.hunts, state.currentHuntId, isLoading, isAuthenticated, toast])

  // Auto-backup removed - data is now persisted in Supabase

  // Get active hunts only (status='active' or no status/legacy completed=false)
  const activeHunts = state.hunts.filter((h) => {
    if (h.archived) return false
    // New status-based logic
    if (h.status === 'completed') return false
    if (h.status === 'active') return true
    // Legacy: if no status field, check completed flag
    return !h.completed
  })
  
  // Get completed hunts (status='completed' or legacy completed=true)
  // Note: Currently computed but not used - kept for future features
  // const completedHunts = state.hunts.filter((h) => {
  //   if (h.archived) return false
  //   if (h.status === 'completed') return true
  //   return h.completed === true
  // })

  // Current hunt must be active (not completed)
  const currentHunt = activeHunts.find((h) => h.id === state.currentHuntId) || null

  // Auto-select first active hunt if currentHuntId is null or points to invalid/completed hunt
  useEffect(() => {
    if (activeHunts.length > 0 && !currentHunt) {
      // Either currentHuntId is null or points to a completed/archived hunt that doesn't exist
      // Auto-select the first active hunt
      const firstActiveHuntId = activeHunts[0].id
      if (state.currentHuntId !== firstActiveHuntId) {
        updateState({ currentHuntId: firstActiveHuntId })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHunts.length, state.currentHuntId]) // Only depend on length and currentHuntId, not currentHunt itself

  const updateState = async (updates: Partial<AppState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates }
      
      // If preferences changed, save them separately
      if ('darkMode' in updates || 'theme' in updates) {
        savePreferences({
          darkMode: newState.darkMode,
          theme: newState.theme,
        })
      }
      
      // If currentHuntId changed, save it
      if ('currentHuntId' in updates) {
        storageService.setCurrentHuntId(newState.currentHuntId)
      }
      
      return newState
    })
  }

  const updateHunt = (id: string, updates: Partial<Hunt>) => {
    setState((prev) => {
      const updated = {
        ...prev,
        hunts: prev.hunts.map((h) => {
          if (h.id === id) {
            const merged = { ...h, ...updates }
            return merged
          }
          return h
        }),
      }
      return updated
    })
  }

  const createHunt = async (name?: string) => {
    const newHunt: Hunt = {
      id: crypto.randomUUID(),
      name: name || 'New Hunt', // Allow creating hunt without name (will be auto-generated)
      createdAt: new Date(),
      startDate: new Date(),
      pokemon: null,
      gameId: null, // Game selection is optional
      method: '',
      oddsP: 0,
      goal: 0,
      count: 0,
      history: [],
      status: 'active', // New hunts are always active
      completed: false, // Keep for backward compatibility
    }
    setState((prev) => ({
      ...prev,
      hunts: [...prev.hunts, newHunt],
      currentHuntId: newHunt.id,
    }))
    setActiveTab('active')
    setShowLandingPage(false)
  }

  // startHunting removed - functionality moved to createHunt dialog

  const duplicateHunt = (id: string) => {
    const hunt = state.hunts.find((h) => h.id === id)
    if (!hunt) return

    const duplicated: Hunt = {
      ...hunt,
      id: crypto.randomUUID(),
      name: `${hunt.name} (Copy)`,
      createdAt: new Date(),
      startDate: new Date(),
      gameId: hunt.gameId || null, // Preserve gameId if it exists
      status: 'active', // Duplicated hunts are always active
      completed: false, // Keep for backward compatibility
      completedAt: undefined,
      endCount: undefined,
      continueCounting: false,
      count: 0,
      history: [],
    }
    setState((prev) => ({
      ...prev,
      hunts: [...prev.hunts, duplicated],
      currentHuntId: duplicated.id,
    }))
    setActiveTab('active')
    toast({
      title: 'Hunt duplicated',
      description: `"${duplicated.name}" has been created.`,
    })
  }

  const renameHunt = (id: string, name: string) => {
    updateHunt(id, { name })
    toast({
      title: 'Hunt renamed',
      description: `Hunt has been renamed to "${name}".`,
    })
  }

  const archiveHunt = (id: string) => {
    updateHunt(id, { archived: true })
    toast({
      title: 'Hunt archived',
      description: 'Hunt has been archived.',
    })
    if (state.currentHuntId === id) {
      const remaining = state.hunts.filter((h) => !h.archived && h.id !== id)
      updateState({ currentHuntId: remaining.length > 0 ? remaining[0].id : null })
    }
  }

  const deleteHunt = (id: string) => {
    setState((prev) => {
      const updated = {
        ...prev,
        hunts: prev.hunts.filter((h) => h.id !== id),
      }
      if (updated.currentHuntId === id) {
        const remaining = updated.hunts.filter((h) => !h.archived && !h.completed)
        updated.currentHuntId = remaining.length > 0 ? remaining[0].id : null
      }
      return updated
    })
    toast({
      title: 'Hunt deleted',
      description: 'Hunt has been permanently deleted.',
    })
  }

  const incrementCount = (delta: number) => {
    if (!currentHunt) return
    // Prevent editing completed hunts
    if (currentHunt.status === 'completed') return
    if (currentHunt.completed && !currentHunt.continueCounting) return

    const newCount = currentHunt.count + delta
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      delta,
      countBefore: currentHunt.count,
      countAfter: newCount,
    }

    updateHunt(currentHunt.id, {
      count: newCount,
      history: [...currentHunt.history, entry],
    })
  }

  const setCount = (newCount: number) => {
    if (!currentHunt) return
    // Prevent editing completed hunts
    if (currentHunt.status === 'completed') return
    if (currentHunt.completed && !currentHunt.continueCounting) return

    const delta = newCount - currentHunt.count
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      delta,
      countBefore: currentHunt.count,
      countAfter: newCount,
    }

    updateHunt(currentHunt.id, {
      count: newCount,
      history: [...currentHunt.history, entry],
    })
  }

  const completeHunt = (continueCounting: boolean) => {
    if (!currentHunt) return

    const completedHuntId = currentHunt.id

    updateHunt(currentHunt.id, {
      status: 'completed',
      completed: true, // Keep for backward compatibility
      completedAt: new Date(),
      endCount: currentHunt.count,
      continueCounting,
    })
    
    toast({
      title: 'Hunt completed!',
      description: `"${currentHunt.name}" has been marked as completed.`,
    })
    
    // If this was the current hunt, switch to another active hunt or clear selection
    if (state.currentHuntId === completedHuntId) {
      const remainingActiveHunts = state.hunts.filter((h) => {
        if (h.id === completedHuntId) return false // Exclude the one we just completed
        if (h.archived) return false
        if (h.status === 'completed') return false
        if (h.status === 'active') return true
        return !h.completed
      })
      
      if (remainingActiveHunts.length > 0) {
        // Switch to the first remaining active hunt
        updateState({ currentHuntId: remainingActiveHunts[0].id })
      } else {
        // No active hunts left, clear selection
        updateState({ currentHuntId: null })
      }
    }
    
    setActiveTab('accomplished')
  }

  const uncompleteHunt = (id: string) => {
    const hunt = state.hunts.find((h) => h.id === id)
    if (!hunt) {
      logger.error('uncompleteHunt: Hunt not found')
      toast({
        title: 'Error',
        description: 'Hunt not found.',
        variant: 'destructive',
      })
      return
    }

    updateHunt(id, {
      status: 'active',
      completed: false, // Keep for backward compatibility
      completedAt: undefined,
      endCount: undefined,
      continueCounting: false,
    })
    
    toast({
      title: 'Hunt moved to active',
      description: 'Hunt has been moved back to active hunts.',
    })
    
    setActiveTab('active')
    
    // Set as current hunt if not already
    if (state.currentHuntId !== id) {
      updateState({ currentHuntId: id })
    }
  }

  const undoLastAction = () => {
    if (!currentHunt || currentHunt.history.length === 0) return

    const lastEntry = currentHunt.history[currentHunt.history.length - 1]
    updateHunt(currentHunt.id, {
      count: lastEntry.countBefore,
      history: currentHunt.history.slice(0, -1),
    })
    toast({
      title: 'Action undone',
      description: 'Last action has been undone.',
    })
  }

  const resetHunt = (type: ResetType, options?: ResetOptions) => {
    if (!currentHunt) return

    // Snapshot removed - undo functionality not currently implemented

    const keepHistory = options?.keepHistory ?? false
    const keepPokemon = options?.keepPokemon ?? true
    const keepSettings = options?.keepSettings ?? true

    if (type === 'count-only') {
      updateHunt(currentHunt.id, {
        count: 0,
        history: keepHistory ? currentHunt.history : [],
      })
    } else if (type === 'whole-hunt') {
      updateHunt(currentHunt.id, {
        count: 0,
        history: [],
        startDate: new Date(),
        goal: keepSettings ? currentHunt.goal : 0,
        pokemon: keepPokemon ? currentHunt.pokemon : null,
      })
    }

    toast({
      title: 'Hunt reset',
      description: 'Hunt has been reset.',
    })
  }

  // hasAnyHunts computed but not currently used
  // const hasAnyHunts = state.hunts.length > 0

  // Show landing page only if explicitly requested, not just because there are no hunts
  // After login, users should see the tracker interface even if they have no hunts yet
  // Show loading state while auth is initializing
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page if not authenticated - redirect to home instead
  if (!isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  // Remove showLandingPage overlay - navigate to / instead
  if (showLandingPage) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <>
        <SEO
          title="Shiny Hunt Tracker — Track Your Pokémon Shiny Hunts"
          description="Track your Pokémon shiny hunts with real-time progress, reset counters, and shiny odds calculations. Monitor multiple hunts, calculate probabilities, and build your shiny Pokédex."
          canonicalUrl="https://www.shinyhunt.app/tracker"
        />
      {/* First 151 Celebration Popup */}
      <First151CelebrationPopup
        open={showFirst151Popup}
        onClose={() => setShowFirst151Popup(false)}
      />
      
      <div className="min-h-screen bg-background relative overflow-x-hidden max-w-full">
      {/* Themed background and sparkles for tracker */}
      <TrackerBackground themeId={state.theme} />
      <FloatingSparkles goldCount={20} cyanCount={15} themeId={state.theme} />
      
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-2.5 md:py-0">
          {/* Mobile: Optimized single-row layout, Desktop: Original layout */}
          <div className="flex items-center justify-between gap-2 md:gap-2 flex-nowrap">
            {/* Left Section: Logo + Hunt Selector */}
            <div className="flex items-center gap-2 md:gap-2 min-w-0 flex-1">
              {/* Logo - Smaller on mobile for better fit */}
              <button
                onClick={() => navigate('/')}
                className="shrink-0 hover:opacity-80 active:opacity-70 transition-all duration-200 flex items-center -my-1 md:-my-2 lg:-my-4"
                aria-label="Home"
                title="Home"
              >
                <img 
                  src="/logo.png" 
                  alt="ShinyHunt.app - Pokémon Shiny Hunt Tracker" 
                  className="h-10 md:h-[135px] lg:h-[172px] w-auto transition-all duration-200"
                />
              </button>
              
              {/* Hunt Selector - Only show on active tab, only show active hunts */}
              {activeTab === 'active' && activeHunts.length > 0 && (
                <div className="min-w-0 flex-1 max-w-[100px] md:max-w-[220px] hidden sm:block">
                  <HuntSwitcher
                    hunts={activeHunts}
                    currentHuntId={state.currentHuntId}
                    onSelectHunt={(id) => {
                      updateState({ currentHuntId: id })
                      setActiveTab('active')
                    }}
                    onCreateHunt={() => setCreateDialogOpen(true)}
                    onDuplicateHunt={duplicateHunt}
                    onRenameHunt={(id) => {
                      setRenameHuntId(id)
                      setRenameDialogOpen(true)
                    }}
                    onArchiveHunt={archiveHunt}
                    onDeleteHunt={(id) => {
                      setDeleteHuntId(id)
                      setDeleteDialogOpen(true)
                    }}
                    showNewHuntButton={false}
                  />
                </div>
              )}
            </div>

            {/* Right Section: Action Icons - Better spacing on mobile */}
            <div className="flex items-center gap-2 md:gap-1 shrink-0 flex-nowrap">
              {/* Auth Buttons - Show when not authenticated */}
              {!isAuthenticated && !loadingAuth && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="hidden sm:flex h-9 md:h-[46px] px-3 md:px-4 text-xs md:text-sm transition-all duration-200"
                  >
                    <LogIn className="h-[12.4px] w-[12.4px] md:h-[16.5px] md:w-[16.5px] mr-1 md:mr-2" />
                    Login
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/signup')}
                    className="h-10 md:h-[46px] px-3 md:px-4 text-xs md:text-sm transition-all duration-200 active:scale-95"
                  >
                    <UserPlus className="h-[12.4px] w-[12.4px] md:h-[16.5px] md:w-[16.5px] mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Create Account</span>
                    <span className="sm:hidden">Sign Up</span>
                  </Button>
                </>
              )}

              {/* Primary Actions - Always visible on mobile and desktop */}
              {/* New Hunt Button - Show on active tab */}
              {activeTab === 'active' && (
                activeHunts.length > 0 ? (
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-10 w-10 md:h-[46px] md:w-[46px] shrink-0 p-0 rounded-lg transition-all duration-200 active:scale-95"
                    title="Create New Hunt"
                  >
                    <Plus className="h-5 w-5 md:h-[20.6px] md:w-[20.6px]" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-10 md:h-[46px] shrink-0 px-3 md:px-4 text-xs md:text-sm rounded-lg transition-all duration-200 active:scale-95"
                  >
                    <Plus className="h-[12.4px] w-[12.4px] md:h-[16.5px] md:w-[16.5px] mr-1 md:mr-2" />
                    <span className="hidden sm:inline">New Hunt</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                )
              )}

              {/* Desktop: Theme Selector - Restored to original position */}
              <div className="hidden md:block">
                <ThemeSelector
                  currentTheme={state.theme}
                  onThemeChange={(theme) => updateState({ theme })}
                />
              </div>
              
              {/* Guides Button - Always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/guides')}
                className={`hidden sm:flex h-9 md:h-[46px] px-3 md:px-4 text-xs md:text-sm transition-all duration-200 ${
                  location.pathname === '/guides' ? 'bg-accent' : ''
                }`}
                title="Shiny Hunting Guides"
              >
                <BookOpen className="h-[12.4px] w-[12.4px] md:h-[16.5px] md:w-[16.5px] mr-1 md:mr-2" />
                Guides
              </Button>
              
              {/* Dark Mode Toggle - Always visible */}
              <DarkModeToggle
                key={`dark-mode-${state.darkMode}`}
                darkMode={state.darkMode}
                onToggle={() => {
                  updateState({ darkMode: !state.darkMode })
                }}
              />
              
              {/* Account Settings - Avatar - Always visible */}
              {isAuthenticated && (
                <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                  <DialogTrigger asChild>
                    <NavAvatar
                      onClick={() => setSettingsDialogOpen(true)}
                      size="md"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto settings-scroll-container">
                    <DialogHeader>
                      <DialogTitle>Account Settings</DialogTitle>
                      <DialogDescription>
                        Manage your account and profile settings
                      </DialogDescription>
                    </DialogHeader>
                    <AccountSettings
                      onSignOut={async () => {
                        await handleLogout()
                        setSettingsDialogOpen(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {/* More Menu - Mobile only: Consolidates less important actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:hidden shrink-0 p-0 rounded-lg transition-all duration-200 active:scale-95"
                    title="More options"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Theme Selector - In more menu on mobile */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Palette className="h-4 w-4 mr-2" />
                      <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {Object.values(themes).map((theme) => (
                        <DropdownMenuItem
                          key={theme.id}
                          onClick={() => updateState({ theme: theme.id })}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-border"
                              style={{
                                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{theme.name}</div>
                            </div>
                            {state.theme === theme.id && (
                              <div className="text-primary">✓</div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-2.5 sm:px-4 md:px-6 py-6 relative z-10 w-full box-border" role="main">
        <h1 className="sr-only">Shiny Hunt Tracker - Track Your Shiny Pokémon Journey</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full overflow-hidden">
          <TabsList className="mb-6 w-full max-w-full" aria-label="Hunt tracking sections">
            <TabsTrigger value="active" className="flex-1 min-w-0">Active Hunts</TabsTrigger>
            <TabsTrigger value="accomplished" className="flex-1 min-w-0">Shiny Collection</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeHunts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <h2 className="text-2xl font-bold">No Active Hunts</h2>
                <p className="text-muted-foreground">Select a game and Pokémon to start tracking!</p>
                <Button onClick={() => {
                  // Create a new hunt without name - will be auto-generated when game + pokemon are selected
                  createHunt()
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Hunt
                </Button>
              </div>
            ) : currentHunt ? (
              <div className="lg:grid lg:grid-cols-[420px_1fr] lg:gap-6 lg:w-full lg:max-w-none flex flex-col gap-6 w-full max-w-full box-border">
                {/* Left Column - Hunt Details + Session Heat Map */}
                {/* Mobile: order-2 (appears second), Desktop: order-1 (appears first) */}
                <div className="order-2 lg:order-1 flex flex-col gap-6 w-full max-w-full box-border">
                  <HuntDetails
                    hunt={currentHunt}
                    onUpdate={(updates) => updateHunt(currentHunt.id, updates)}
                    onSetCount={setCount}
                    onDelete={(id) => {
                      setDeleteHuntId(id)
                      setDeleteDialogOpen(true)
                    }}
                    onAutoCreate={(hunt) => {
                      // Hunt was auto-created when game + pokemon were selected
                      toast({
                        title: 'Hunt created successfully',
                        description: `${hunt.name} is now tracking your shiny hunt!`,
                      })
                    }}
                    themeId={state.theme}
                  />
                  
                </div>

                {/* Right Column - Progress */}
                {/* Mobile: order-1 (appears first), Desktop: order-2 (appears second) */}
                <div className="order-1 lg:order-2 flex flex-col gap-6 w-full max-w-full box-border">
                  {/* Progress Panel */}
                  <ProgressPanelV3
                    hunt={currentHunt}
                    activeHunts={activeHunts}
                    currentHuntId={state.currentHuntId}
                    onSelectHunt={(id) => {
                      updateState({ currentHuntId: id })
                    }}
                    onIncrement={incrementCount}
                    onUndo={undoLastAction}
                    onComplete={() => {
                      // Open complete dialog - ProgressPanelV3 doesn't handle continueCounting
                      setCompleteDialogOpen(true)
                    }}
                    onReset={() => {
                      // Open reset dialog - ProgressPanelV3 doesn't handle ResetType/Options
                      setResetDialogOpen(true)
                    }}
                    onUpdate={(updates) => updateHunt(currentHunt.id, updates)}
                    themeId={state.theme}
                  />

                </div>
              </div>
            ) : (
              // Fallback: active hunts exist but currentHunt is null (shouldn't happen, but handle gracefully)
              <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <h2 className="text-2xl font-bold">Select a Hunt</h2>
                <p className="text-muted-foreground">Please select a hunt from the dropdown above.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accomplished">
            <AccomplishedView
              hunts={state.hunts}
              onMoveToActive={uncompleteHunt}
              onDeleteHunt={(id) => {
                setDeleteHuntId(id)
                setDeleteDialogOpen(true)
              }}
            />
          </TabsContent>
        </Tabs>
      </main>


      <CreateHuntDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createHunt}
      />

      {renameHuntId && (
        <RenameHuntDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          currentName={
            state.hunts.find((h) => h.id === renameHuntId)?.name || ''
          }
          onRename={(name) => {
            renameHunt(renameHuntId, name)
            setRenameHuntId(null)
          }}
        />
      )}

      {deleteHuntId && (
        <DeleteHuntDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          huntName={
            state.hunts.find((h) => h.id === deleteHuntId)?.name || ''
          }
          onConfirm={() => {
            deleteHunt(deleteHuntId)
            setDeleteHuntId(null)
          }}
        />
      )}

      {currentHunt && (
        <>
          <CompleteHuntDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            huntName={currentHunt.name}
            onConfirm={completeHunt}
          />
          <ResetHuntDialog
            open={resetDialogOpen}
            onOpenChange={setResetDialogOpen}
            huntName={currentHunt.name}
            onConfirm={resetHunt}
          />
        </>
      )}
    </div>
    </>
  )
}
