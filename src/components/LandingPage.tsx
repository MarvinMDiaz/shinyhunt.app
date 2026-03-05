import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles, Trophy, BarChart3, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'

interface LandingPageProps {
  onStartHunting: () => void
  onViewTrophyCase: () => void
  completedHuntsCount?: number
}

// Region map images - you can replace these URLs with actual region map images
// Options:
// 1. Host your own images in /public/images/regions/ folder
// 2. Use a CDN service
// 3. Use Bulbapedia images (check licensing)
const REGIONS = [
  { 
    name: 'Kanto', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/4/4a/Kanto_RB.png/800px-Kanto_RB.png',
    fallbackGradient: 'from-blue-600 via-blue-500 to-blue-400' 
  },
  { 
    name: 'Johto', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/7/7d/Johto_Map.png/800px-Johto_Map.png',
    fallbackGradient: 'from-green-600 via-green-500 to-green-400' 
  },
  { 
    name: 'Hoenn', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/8/8e/Hoenn_Map_RSE.png/800px-Hoenn_Map_RSE.png',
    fallbackGradient: 'from-red-600 via-red-500 to-red-400' 
  },
  { 
    name: 'Sinnoh', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/4/4c/Sinnoh_Map_DPPt.png/800px-Sinnoh_Map_DPPt.png',
    fallbackGradient: 'from-purple-600 via-purple-500 to-purple-400' 
  },
  { 
    name: 'Unova', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/9/9a/Unova_Map_BW.png/800px-Unova_Map_BW.png',
    fallbackGradient: 'from-yellow-600 via-yellow-500 to-yellow-400' 
  },
  { 
    name: 'Kalos', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/0/0a/Kalos_Map_XY.png/800px-Kalos_Map_XY.png',
    fallbackGradient: 'from-pink-600 via-pink-500 to-pink-400' 
  },
  { 
    name: 'Alola', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/1/1a/Alola_Map_SM.png/800px-Alola_Map_SM.png',
    fallbackGradient: 'from-orange-600 via-orange-500 to-orange-400' 
  },
  { 
    name: 'Galar', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/3/3a/Galar_Map.png/800px-Galar_Map.png',
    fallbackGradient: 'from-indigo-600 via-indigo-500 to-indigo-400' 
  },
  { 
    name: 'Paldea', 
    image: 'https://archives.bulbagarden.net/media/upload/thumb/8/8a/Paldea_Map.png/800px-Paldea_Map.png',
    fallbackGradient: 'from-teal-600 via-teal-500 to-teal-400' 
  },
]

function RegionSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % REGIONS.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + REGIONS.length) % REGIONS.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % REGIONS.length)
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index))
  }

  const currentRegion = REGIONS[currentIndex]
  const useFallback = imageErrors.has(currentIndex)

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {useFallback ? (
            <div className={`absolute inset-0 bg-gradient-to-br ${currentRegion.fallbackGradient} md:blur-0 blur-sm`}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/20 text-4xl md:text-8xl font-bold select-none">
                  {currentRegion.name}
                </div>
              </div>
            </div>
          ) : (
            <>
              <img
                src={currentRegion.image}
                alt={`${currentRegion.name} region map`}
                className="w-full h-full object-cover md:blur-0 blur-sm"
                onError={() => handleImageError(currentIndex)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/80" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {REGIONS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function FloatingSparkles() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * dimensions.height],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

export function LandingPage({ onStartHunting, onViewTrophyCase, completedHuntsCount = 0 }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <RegionSlideshow />
        <FloatingSparkles />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
              <img 
                src="/logo.png" 
                alt="ShinyHunt.app" 
                className="h-56 md:h-72 lg:h-96 w-auto drop-shadow-2xl"
              />
            </div>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg mb-8">
              Track your shiny hunts, calculate your odds, and build your trophy case.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              onClick={onStartHunting}
            >
              Start Hunting
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-6 h-auto backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
              onClick={onViewTrophyCase}
            >
              <Trophy className="h-5 w-5 mr-2" />
              View Trophy Case
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
            className="text-white/70"
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to track your shiny Pokémon journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Track Hunts',
                description: 'Monitor multiple hunts simultaneously with detailed progress tracking and history logs.',
              },
              {
                icon: BarChart3,
                title: 'Probability Stats',
                description: 'Calculate your odds, expected attempts, and confidence intervals with real-time statistics.',
              },
              {
                icon: Trophy,
                title: 'Trophy Case',
                description: 'Showcase your completed shiny hunts in a beautiful trophy case with detailed achievements.',
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
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Start tracking in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Choose your Pokémon', description: 'Search and select the Pokémon you want to hunt.' },
              { step: '2', title: 'Track encounters/resets', description: 'Use the counter buttons or set your count directly.' },
              { step: '3', title: 'Celebrate your shiny', description: 'Mark as completed and add it to your trophy case!' },
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

