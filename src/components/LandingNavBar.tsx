import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Target, Trophy, BookOpen, LogIn } from 'lucide-react'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { useAuth } from '@/context/AuthContext'
import { NavAvatar } from '@/components/NavAvatar'
import { useState } from 'react'
import { AccountSettings } from '@/components/AccountSettings'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

const NAV_LINK_CLASS =
  'inline-flex flex-row items-center gap-2 h-9 md:h-10 px-3 rounded-md text-sm md:text-base font-medium text-foreground hover:text-cyan-600 dark:hover:text-yellow-400 hover:bg-muted dark:hover:bg-white/10 transition-colors'

/** Shared navbar for homepage and public /tracker, /trophy-case pages. Matches production styling. */
export function LandingNavBar({
  onNavigateToTracker,
  onViewTrophyCase,
  darkMode,
  onToggleDarkMode,
}: {
  onNavigateToTracker?: () => void
  onViewTrophyCase?: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}) {
  const { isAuthenticated, loadingAuth, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  const isOnPublicLanding = location.pathname === '/tracker' || location.pathname === '/trophy-case'
  const useDirectLinks = isOnPublicLanding

  const handleTrackerClick = (e: React.MouseEvent) => {
    if (useDirectLinks) return
    if (!isAuthenticated && onNavigateToTracker) {
      e.preventDefault()
      onNavigateToTracker()
    }
  }

  const handleTrophyClick = (e: React.MouseEvent) => {
    if (useDirectLinks) return
    if (!isAuthenticated && onViewTrophyCase) {
      e.preventDefault()
      onViewTrophyCase()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 py-2 md:py-4" role="navigation">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - production-sized */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              loading="lazy"
              src="/logo.png"
              alt="ShinyHunt.app - Pokémon Shiny Hunt Tracker"
              className="h-[64px] sm:h-[72px] md:h-[96px] w-auto object-contain"
            />
          </Link>
        </div>

        {/* Nav items - horizontal row, icon + label side-by-side */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 shrink-0">
          <Link
            to="/tracker"
            onClick={handleTrackerClick}
            className={`${NAV_LINK_CLASS} ${location.pathname === '/tracker' ? 'bg-white/20' : ''}`}
          >
            <Target className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            <span className="hidden sm:inline">Tracker</span>
            <span className="sm:hidden">Tracker</span>
          </Link>
          <Link
            to="/trophy-case"
            onClick={handleTrophyClick}
            className={`${NAV_LINK_CLASS} ${location.pathname === '/trophy-case' ? 'bg-muted/80 dark:bg-white/20' : ''}`}
          >
            <Trophy className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            <span className="hidden sm:inline">Trophy Case</span>
            <span className="sm:hidden">Trophy</span>
          </Link>
          <Link
            to="/guides"
            className={`${NAV_LINK_CLASS} ${location.pathname === '/guides' ? 'bg-muted/80 dark:bg-white/20' : ''}`}
          >
            <BookOpen className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            <span className="hidden sm:inline">Guides</span>
            <span className="sm:hidden">Guides</span>
          </Link>
          {!loadingAuth && !isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`${NAV_LINK_CLASS} bg-transparent border-0 cursor-pointer`}
            >
              <LogIn className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}
          {!loadingAuth && isAuthenticated && (
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <NavAvatar onClick={() => setSettingsDialogOpen(true)} className="h-9 w-9 md:h-10 md:w-10" size="md" />
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AccountSettings onSignOut={handleSignOut} />
              </DialogContent>
            </Dialog>
          )}
          <div className="relative" style={{ zIndex: 9999 }}>
            <DarkModeToggle key={`dark-mode-${darkMode}`} darkMode={darkMode} onToggle={onToggleDarkMode} />
          </div>
        </div>
      </div>
    </nav>
  )
}
