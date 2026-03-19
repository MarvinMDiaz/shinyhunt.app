import { Link } from 'react-router-dom'
import { ChevronDown, Sparkles, Trophy, BarChart3, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { FloatingSparkles } from '@/components/FloatingSparkles'
import { BrandedBackground } from '@/components/BrandedBackground'
import { LandingNavBar } from '@/components/LandingNavBar'

interface LandingPageProps {
  onStartHunting: () => void
  onNavigateToTracker?: () => void
  onViewTrophyCase: () => void
  completedHuntsCount?: number
  darkMode: boolean
  onToggleDarkMode: () => void
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
            <p className="text-xl md:text-2xl text-foreground drop-shadow-lg mb-8 font-medium dark:text-white/95">
              Track your shiny hunts, calculate your odds, and build your trophy case.
            </p>
            
            {/* SEO-friendly crawlable text */}
            <div className="sr-only">
              <p>
                ShinyHunt.app is a free Pokémon shiny hunt tracker for shiny hunters. Track shiny hunts across all generations, 
                view estimated odds and probability milestones, monitor encounter counts, and build your shiny collection. 
                Our shiny hunting tracker helps you track Pokémon hunts with encounter logging, odds insight, and a trophy case. 
                Works for Pokémon Red, Blue, Gold, Silver, Ruby, Sapphire, Diamond, Pearl, Black, White, X, Y, Sun, Moon, 
                Sword, Shield, Scarlet, Violet, and all other games. A shiny odds tracker and shiny collection tracker in one.
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
            className="text-foreground/80 dark:text-white/80"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
            }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* About — what ShinyHunt is and who it's for (landing page only, not in nav) */}
      <section className="py-28 px-4 bg-white dark:bg-background border-t border-gray-100 dark:border-border" aria-labelledby="about-heading">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="about-heading" className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              About ShinyHunt
            </h2>
            <p className="text-foreground/90 text-lg dark:text-muted-foreground leading-relaxed mb-5">
              ShinyHunt is a Pokémon shiny hunt tracker built for shiny hunters. Use it to track shiny hunts across all generations, log encounter counts, and see your odds as you go.
            </p>
            <p className="text-foreground/90 text-base dark:text-muted-foreground leading-relaxed">
              The shiny odds tracker shows your chance so far, expected attempts, and when you'll hit key probability milestones. You can run multiple hunts at once and add your catches to a trophy case. It works in your browser. No download required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 1. Feature Overview — WHY this app is useful */}
      <section className="py-28 px-4 bg-slate-50/90 dark:bg-background/80 border-t border-gray-100 dark:border-border" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold mb-5 text-foreground">
              What You Get
            </h2>
            <p className="text-foreground/90 text-lg max-w-2xl mx-auto dark:text-muted-foreground leading-relaxed">
              A free shiny hunt tracker for Pokémon. Log encounters, see your odds, and build your collection. No download required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: Target,
                title: 'Track Multiple Shiny Hunts at Once',
                description: 'Run several hunts at the same time. Log encounter counts as you hunt and see progress across all your active targets.',
              },
              {
                icon: BarChart3,
                title: 'See Your Shiny Odds and Progress',
                description: 'See your chance so far, expected attempts, and when you\'ll hit 50% or 90% probability.',
              },
              {
                icon: Trophy,
                title: 'Build Your Shiny Collection',
                description: 'Mark shinies as caught and add them to your trophy case. Celebrate every find.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white shadow-lg border border-gray-200/80 hover:shadow-xl hover:border-cyan-500/20 transition-all dark:bg-card dark:border-border dark:shadow-lg dark:shadow-black/10 dark:hover:border-cyan-400/40 dark:hover:shadow-xl dark:hover:shadow-cyan-500/5">
                  <CardHeader className="pb-3 pt-6 px-6">
                    <feature.icon className="h-12 w-12 mb-4 text-cyan-600 dark:text-cyan-400" />
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <CardDescription className="text-base text-foreground/90 leading-relaxed dark:text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. How It Works — HOW to use it */}
      <section className="py-28 px-4 bg-white dark:bg-background border-t border-gray-100 dark:border-border" aria-labelledby="how-it-works-heading">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold mb-5 text-foreground">
              How It Works
            </h2>
            <p className="text-foreground/90 text-lg dark:text-muted-foreground max-w-xl mx-auto">
              Three steps to start tracking your shiny hunts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Select the Pokémon you want to hunt', description: 'Search and pick your target. Works for all Pokémon from Gen 1 to Gen 10.' },
              { step: '2', title: 'Log your encounters as you hunt', description: 'Use the counter or set your count directly. Your progress updates as you go.' },
              { step: '3', title: 'Add shinies to your collection', description: 'Mark shinies as caught and add them to your trophy case.' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-600 dark:bg-cyan-400/25 dark:text-cyan-300 flex items-center justify-center text-xl font-bold mx-auto mb-5 ring-2 ring-cyan-500/40 dark:ring-cyan-400/50">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-foreground/90 text-sm leading-relaxed dark:text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Final CTA — WHY start now */}
      <section className="py-28 px-4 bg-gradient-to-b from-slate-50 to-white dark:from-muted/30 dark:to-background border-t border-gray-100 dark:border-border" aria-labelledby="cta-heading">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-5 text-foreground">
            Start Tracking Your Shiny Hunts Today
          </h2>
          <p className="text-foreground/90 text-lg mb-12 dark:text-muted-foreground max-w-lg mx-auto">
            Log encounters, see your odds, and build your collection. Free to use. No download required.
          </p>
          <Button
            size="lg"
            className="text-lg px-10 py-6 h-auto font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-xl transition-all dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-900 dark:shadow-lg dark:shadow-cyan-400/30"
            onClick={onStartHunting}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started Now
          </Button>
        </motion.div>
      </section>

      {/* Footer - internal links for sitelinks */}
      <footer className="py-8 px-4 border-t border-gray-200 dark:border-border bg-white dark:bg-background" role="contentinfo">
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

