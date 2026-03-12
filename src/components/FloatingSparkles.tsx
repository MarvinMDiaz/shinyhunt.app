import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ThemeId, getTheme } from '@/lib/themes'

interface FloatingSparklesProps {
  count?: number
  goldCount?: number
  cyanCount?: number
  themeId?: ThemeId
}

export function FloatingSparkles({ 
  count = 50,
  goldCount = 20,
  cyanCount = 15,
  themeId = 'default'
}: FloatingSparklesProps) {
  const theme = getTheme(themeId)
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
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {/* Primary color sparkles */}
      {[...Array(goldCount)].map((_, i) => (
        <motion.div
          key={`primary-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${3 + Math.random() * 5}px`,
            height: `${3 + Math.random() * 5}px`,
            background: `radial-gradient(circle, ${theme.primaryColor}, ${theme.secondaryColor})`,
            boxShadow: `0 0 10px ${theme.primaryColor}FF, 0 0 20px ${theme.primaryColor}80`,
          }}
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * dimensions.height],
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1.2, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      {/* Secondary color sparkles */}
      {[...Array(cyanCount)].map((_, i) => (
        <motion.div
          key={`secondary-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
            background: `radial-gradient(circle, ${theme.secondaryColor}, ${theme.primaryColor})`,
            boxShadow: `0 0 10px ${theme.secondaryColor}FF, 0 0 20px ${theme.secondaryColor}80`,
          }}
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * dimensions.height],
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1.2, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2.5,
            repeat: Infinity,
            delay: Math.random() * 2.5,
          }}
        />
      ))}
    </div>
  )
}
