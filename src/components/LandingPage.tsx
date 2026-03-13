import { ChevronDown, Sparkles, Trophy, BarChart3, Target, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { FloatingSparkles } from '@/components/FloatingSparkles'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { NavAvatar } from '@/components/NavAvatar'
import { useState } from 'react'
import { AccountSettings } from '@/components/AccountSettings'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface LandingPageProps {
  onStartHunting: () => void
  onNavigateToTracker?: () => void
  onViewTrophyCase: () => void
  completedHuntsCount?: number
  darkMode: boolean
  onToggleDarkMode: () => void
}

// Navigation bar for landing page - uses global auth state
function LandingNavBar({ onNavigateToTracker, onViewTrophyCase, darkMode, onToggleDarkMode }: {
  onNavigateToTracker: () => void
  onViewTrophyCase: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}) {
  const { isAuthenticated, loadingAuth, signOut } = useAuth()
  const navigate = useNavigate()
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-6 py-2 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo - Match tracker app navbar size */}
        <div className="flex items-center">
          <img
            loading="lazy"
            src="/logo.png"
            alt="ShinyHunt.app - Pokémon Shiny Hunt Tracker"
            className="h-[59px] md:h-[135px] lg:h-[172px] w-auto"
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToTracker}
            className="text-white hover:text-yellow-400 hover:bg-white/10 h-9 md:h-10 text-sm md:text-base"
          >
            <Target className="h-4 w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Tracker</span>
            <span className="sm:hidden">Tracker</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewTrophyCase}
            className="text-white hover:text-yellow-400 hover:bg-white/10 h-9 md:h-10 text-sm md:text-base"
          >
            <Trophy className="h-4 w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Trophy Case</span>
            <span className="sm:hidden">Trophy</span>
          </Button>
          {/* Auth buttons - show based on global auth state */}
          {!loadingAuth && !isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateToLogin}
              className="text-white hover:text-yellow-400 hover:bg-white/10 h-9 md:h-10 text-sm md:text-base"
            >
              <LogIn className="h-4 w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </Button>
          )}
          
          {/* Profile avatar - show when authenticated */}
          {!loadingAuth && isAuthenticated && (
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <NavAvatar
                  onClick={() => setSettingsDialogOpen(true)}
                  className="h-9 w-9 md:h-10 md:w-10"
                  size="md"
                />
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AccountSettings onSignOut={handleSignOut} />
              </DialogContent>
            </Dialog>
          )}
          <div className="relative" style={{ zIndex: 9999 }}>
            <DarkModeToggle
              key={`dark-mode-${darkMode}`}
              darkMode={darkMode}
              onToggle={() => {
                onToggleDarkMode()
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

// Branded background with Sinnoh-inspired purple and ShinyHunt brand colors
function BrandedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {/* Base gradient - Sinnoh purple blended with brand colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800" />
      
      {/* Animated gradient overlays with brand colors - subtle */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, transparent 50%, rgba(0, 206, 209, 0.05) 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* Animated golden orb - subtle */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08), transparent)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* Animated cyan orb - subtle */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 206, 209, 0.08), transparent)',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* Additional shimmer effect - very subtle */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.03) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 200%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Dark overlay for text readability - stronger */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/85" />
    </div>
  )
}

export function LandingPage({ onStartHunting, onNavigateToTracker, onViewTrophyCase, darkMode, onToggleDarkMode }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Navigation Bar */}
      <LandingNavBar
        onNavigateToTracker={onNavigateToTracker || onStartHunting}
        onViewTrophyCase={onViewTrophyCase}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <BrandedBackground />
        <FloatingSparkles goldCount={20} cyanCount={15} themeId="default" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="flex flex-col items-center justify-center gap-6 mb-6">
              <h1 className="sr-only">ShinyHunt.app - Track Your Shiny Pokémon Journey</h1>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                className="relative"
              >
                {/* Multiple glow layers for shiny effect - subtle */}
                <motion.div
                  className="absolute inset-0 -z-10 blur-3xl"
                  animate={{
                    opacity: [0.15, 0.25, 0.15],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-yellow-400/30 via-cyan-400/30 to-yellow-400/30 rounded-full" />
                </motion.div>
                
                <motion.div
                  className="absolute inset-0 -z-10 blur-2xl"
                  animate={{
                    opacity: [0.2, 0.3, 0.2],
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-r from-cyan-400/30 via-yellow-400/30 to-cyan-400/30 rounded-full" />
                </motion.div>
                
                {/* Logo with subtle drop shadow */}
                <img
            loading="lazy" 
                  src="/logo.png" 
                  alt="ShinyHunt.app - Pokémon Shiny Hunt Tracker Logo" 
                  className="h-56 md:h-72 lg:h-96 w-auto relative z-10"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3)) drop-shadow(0 0 10px rgba(0, 206, 209, 0.2))',
                  }}
                />
              </motion.div>
            </div>
            <p className="text-xl md:text-2xl text-white/95 drop-shadow-lg mb-8 font-medium">
              Track your shiny hunts, calculate your odds, and build your trophy case.
            </p>
            
            {/* SEO-friendly crawlable text */}
            <div className="sr-only">
              <p>
                ShinyHunt.app is a free Pokémon shiny hunt tracker designed for shiny hunters. 
                Track shiny hunts across all Pokémon generations, calculate shiny odds, monitor your progress, 
                and build your shiny collection. Our shiny hunting tracker helps you track Pokémon hunts 
                with real-time statistics, probability calculations, and milestone tracking. 
                Whether you're hunting in Pokémon Red, Blue, Gold, Silver, Ruby, Sapphire, Diamond, Pearl, 
                Black, White, X, Y, Sun, Moon, Sword, Shield, Scarlet, Violet, or any other game, 
                ShinyHunt.app is the best shiny collection tracker for tracking your shiny Pokémon journey.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 text-lg px-8 py-6 h-auto shadow-lg hover:shadow-2xl transition-all font-semibold"
              onClick={onStartHunting}
              style={{
                boxShadow: '0 4px 20px rgba(0, 206, 209, 0.4), 0 0 30px rgba(0, 206, 209, 0.2)',
              }}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start Hunting
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/80"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
            }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* SEO Content Section - Visible crawlable text */}
      <section className="py-16 px-4 bg-background/50">
        <div className="max-w-4xl mx-auto text-center">
          <article>
            <h2 className="text-3xl font-bold mb-6">The Best Shiny Hunt Tracker for Pokémon</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground space-y-4">
              <p>
                <strong>ShinyHunt.app</strong> is a free, powerful <strong>Pokémon shiny hunting tracker</strong> that helps you track shiny hunts, 
                calculate odds, monitor progress, and build your shiny collection. Whether you're hunting for shiny starters, 
                legendary Pokémon, or your favorite species, our <strong>shiny odds tracker</strong> provides everything you need 
                to track Pokémon hunts effectively.
              </p>
              <p>
                Our <strong>shiny collection tracker</strong> features real-time probability calculations, progress visualization, 
                and milestone tracking. Track multiple shiny hunts simultaneously, monitor your encounter counts, 
                and celebrate your successes in your personal trophy case. Perfect for shiny hunters across all generations 
                from Gen 1 to Gen 10.
              </p>
              <p>
                Start tracking your shiny hunts today with the most comprehensive <strong>shiny hunt tracker</strong> available. 
                Free to use, no downloads required, and works on all devices.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4 bg-background" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 id="features-heading" className="text-4xl font-bold mb-4">Powerful Features for Shiny Hunters</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to track your shiny Pokémon journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Track Shiny Hunts',
                description: 'Monitor multiple shiny hunts simultaneously with detailed progress tracking, encounter counts, and history logs. Perfect for tracking Pokémon hunts across all games.',
              },
              {
                icon: BarChart3,
                title: 'Shiny Odds Calculator',
                description: 'Calculate your shiny odds, expected attempts, and confidence intervals with real-time statistics. Our shiny odds tracker helps you understand your probability of success.',
              },
              {
                icon: Trophy,
                title: 'Shiny Collection Tracker',
                description: 'Build and showcase your shiny collection in a beautiful trophy case. Track milestones, achievements, and celebrate your shiny hunting successes.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 mb-4 text-primary" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">How to Track Your Shiny Hunts</h2>
            <p className="text-muted-foreground text-lg">
              Start tracking your Pokémon shiny hunts in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose Your Pokémon', description: 'Search and select the Pokémon you want to hunt. Our shiny hunt tracker supports all Pokémon from Gen 1 to Gen 10.' },
              { step: '2', title: 'Track Encounters', description: 'Use the counter buttons or set your encounter count directly. Monitor your progress in real-time as you hunt.' },
              { step: '3', title: 'Build Your Collection', description: 'Mark your shiny as completed and add it to your shiny collection tracker. Celebrate milestones and achievements!' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to Start Hunting?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of trainers tracking their shiny Pokémon journeys
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={onStartHunting}
          >
            Get Started Now
          </Button>
        </motion.div>
      </section>
    </div>
  )
}

