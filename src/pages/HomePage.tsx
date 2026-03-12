import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { LandingPage } from '@/components/LandingPage'
import { useAuth } from '@/context/AuthContext'
import { loadPreferences, savePreferences } from '@/lib/preferencesStorage'
import { SEO } from '@/components/SEO'

export function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated: authenticated, loadingAuth } = useAuth()
  const isInitialMount = useRef(true)
  const [darkMode, setDarkMode] = useState(() => {
    const prefs = loadPreferences()
    return prefs.darkMode
  })

  // Redirect authenticated users to tracker
  useEffect(() => {
    if (!loadingAuth && authenticated) {
      navigate('/tracker', { replace: true })
    }
  }, [authenticated, loadingAuth, navigate])

  const handleStartHunting = () => {
    if (!authenticated) {
      navigate('/signup')
    } else {
      // Navigate to tracker, which will create a hunt if none exist
      navigate('/tracker')
    }
  }

  const handleViewTrophyCase = () => {
    if (!authenticated) {
      navigate('/signup')
    } else {
      // Navigate to tracker and show trophy case
      navigate('/tracker')
    }
  }

  const handleNavigateToTracker = () => {
    navigate('/tracker')
  }

  // Don't pass onNavigateToLogin - LandingNavBar now uses auth context directly

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Save dark mode to preferences whenever it changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    savePreferences({ darkMode })
  }, [darkMode])

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const newValue = !prev
      // Save preference immediately
      savePreferences({ darkMode: newValue })
      return newValue
    })
  }

  try {
    return (
      <>
        <SEO
          title="Shiny Hunt Tracker - Pokémon Shiny Hunting Tracker"
          description="Free shiny hunt tracker for Pokémon. Track shiny hunts, calculate odds, monitor progress, and build your shiny collection. The best shiny hunting tracker for tracking Pokémon hunts across all generations."
          canonicalUrl="/"
        />
        <LandingPage
          onStartHunting={handleStartHunting}
          onNavigateToTracker={handleNavigateToTracker}
          onViewTrophyCase={handleViewTrophyCase}
          completedHuntsCount={0}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      </>
    )
  } catch (error) {
    logger.error('Error rendering HomePage')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">ShinyHunt.app</h1>
          <p className="text-muted-foreground mb-4">Error loading page</p>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Create Account
          </button>
        </div>
      </div>
    )
  }
}
