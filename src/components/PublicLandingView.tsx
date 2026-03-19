import { Link } from 'react-router-dom'
import { Target, Trophy, BookOpen, LogIn, UserPlus, BarChart3, Sparkles, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrackerPreviewCard } from '@/components/TrackerPreviewCard'
import { ShinyCompletionPreviewCard } from '@/components/ShinyCompletionPreviewCard'
import { TrackEncountersPreviewCard } from '@/components/TrackEncountersPreviewCard'
import { CalculateOddsPreviewCard } from '@/components/CalculateOddsPreviewCard'
import { motion } from 'framer-motion'
import { FloatingSparkles } from '@/components/FloatingSparkles'
import { BrandedBackground } from '@/components/BrandedBackground'
import { LandingNavBar } from '@/components/LandingNavBar'

interface PublicLandingViewProps {
  variant: 'tracker' | 'trophy-case'
  darkMode: boolean
  onToggleDarkMode: () => void
}

const TRACKER_FEATURES = [
  {
    icon: Target,
    title: 'Track Encounters',
    description: 'Monitor encounter counts in real time. Log resets, track phases, and keep a detailed history of every hunt.',
  },
  {
    icon: BarChart3,
    title: 'Calculate Odds',
    description: 'See your shiny odds, expected attempts, and confidence intervals. Know exactly where you stand.',
  },
  {
    icon: Sparkles,
    title: 'Shiny Completion',
    description: 'When you find a shiny, celebrate with a trophy and track your results. Achievement unlocked.',
  },
]

const TROPHY_FEATURES = [
  {
    icon: Trophy,
    title: 'Showcase Completed Hunts',
    description: 'Display your finished shiny hunts with encounter counts, dates, and game details. Your achievements, front and center.',
  },
  {
    icon: Sparkles,
    title: 'Build Your Shiny Collection',
    description: 'Grow your shiny Pokédex. Track every species you\'ve caught and celebrate your expanding collection.',
  },
  {
    icon: Target,
    title: 'Celebrate Every Find',
    description: 'Mark milestones, share your wins, and relive your best hunts. Every shiny deserves recognition.',
  },
]

export function PublicLandingView({ variant, darkMode, onToggleDarkMode }: PublicLandingViewProps) {
  const isTracker = variant === 'tracker'

  const headline = isTracker
    ? 'Shiny Hunt Tracker'
    : 'Trophy Case'
  const subheadline = isTracker
    ? 'Track your Pokémon shiny hunts with real-time progress, reset counters, and shiny odds calculations. Monitor multiple hunts, calculate probabilities, and build your shiny Pokédex.'
    : 'Showcase your completed shiny hunts and build your trophy case. Track achievements, milestones, and your growing shiny collection.'

  const features = isTracker ? TRACKER_FEATURES : TROPHY_FEATURES

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <BrandedBackground />
      <FloatingSparkles goldCount={20} cyanCount={15} themeId="default" />

      <LandingNavBar darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      {/* Hero Section - tracker uses tighter height for smoother flow */}
      <section className={`relative flex items-center justify-center overflow-hidden ${isTracker ? 'min-h-[70vh] py-16' : 'min-h-screen'}`}>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <h1 className="mb-6">
              {isTracker ? (
                <span
                  className="inline-block text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-cyan-600 dark:from-white dark:via-cyan-100 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-lg"
                >
                  {headline}
                </span>
              ) : (
                <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground drop-shadow-lg">
                  {headline}
                </span>
              )}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/95 drop-shadow-lg mb-8 font-medium">
              {subheadline}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-row flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-md text-lg font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 shadow-lg hover:shadow-2xl transition-all"
              style={{
                boxShadow: '0 4px 20px rgba(0, 206, 209, 0.4), 0 0 30px rgba(0, 206, 209, 0.2)',
              }}
            >
              <UserPlus className="h-5 w-5" />
              Create Account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-md text-lg font-semibold border-2 border-border bg-muted/50 text-foreground hover:bg-muted transition-all"
            >
              <LogIn className="h-5 w-5" />
              Log In
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator - matches homepage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className={`absolute left-1/2 -translate-x-1/2 z-10 ${isTracker ? 'bottom-6' : 'bottom-8'}`}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-foreground/80"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* Feature + Preview Section - 2x2 balanced grid on desktop for tracker */}
      <section className={`relative z-10 px-4 ${isTracker ? 'pt-12 pb-20' : 'py-20'}`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {isTracker ? 'Everything You Need to Hunt' : 'Your Shiny Achievements'}
            </h2>
            <p className="text-foreground/85 text-lg dark:text-muted-foreground">
              {isTracker ? 'Powerful tools for serious shiny hunters' : 'Celebrate and showcase every shiny you find'}
            </p>
          </motion.div>

          {isTracker ? (
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  {feature.title === 'Track Encounters' ? (
                    <TrackEncountersPreviewCard />
                  ) : feature.title === 'Calculate Odds' ? (
                    <CalculateOddsPreviewCard />
                  ) : feature.title === 'Shiny Completion' ? (
                    <ShinyCompletionPreviewCard />
                  ) : (
                    <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 hover:bg-white transition-colors backdrop-blur-sm dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:hover:bg-white/10 dark:border">
                      <CardHeader>
                        <feature.icon className="h-10 w-10 mb-2 text-cyan-500 dark:text-cyan-400" />
                        <CardTitle className="text-foreground">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-foreground/85 text-base dark:text-muted-foreground">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <TrackerPreviewCard />
              </motion.div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 hover:bg-white transition-colors backdrop-blur-sm dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:hover:bg-white/10 dark:border">
                    <CardHeader>
                      <feature.icon className="h-10 w-10 mb-2 text-cyan-500 dark:text-cyan-400" />
                      <CardTitle className="text-foreground">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-foreground/85 text-base dark:text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="md:col-span-3 md:max-w-xl md:mx-auto"
              >
                <Card className="h-full bg-white/95 shadow-sm border-gray-200/90 backdrop-blur-sm overflow-hidden dark:bg-white/5 dark:shadow-none dark:border-white/20 dark:border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-lg">Your Trophy Showcase</CardTitle>
                    <CardDescription className="text-foreground/85 text-sm dark:text-muted-foreground">
                      Completed hunts appear here
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg bg-muted flex items-center justify-center text-2xl text-muted-foreground"
                        >
                          ?
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-foreground/80 text-center pt-4 dark:text-muted-foreground">
                      Sign in to build your collection
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Footer - matches homepage */}
      <footer className="relative z-10 py-10 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-foreground/80 dark:text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/tracker" className="hover:text-foreground transition-colors">Tracker</Link>
          <Link to="/trophy-case" className="hover:text-foreground transition-colors">Trophy Case</Link>
          <Link to="/guides" className="hover:text-foreground transition-colors">Guides</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
          <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
        </div>
      </footer>
    </div>
  )
}
