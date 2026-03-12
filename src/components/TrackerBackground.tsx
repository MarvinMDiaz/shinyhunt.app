import { motion } from 'framer-motion'
import { getTheme } from '@/lib/themes'
import { ThemeId } from '@/lib/themes'

interface TrackerBackgroundProps {
  themeId?: ThemeId
}

export function TrackerBackground({ themeId = 'default' }: TrackerBackgroundProps) {
  const theme = getTheme(themeId)

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient - subtle dark background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.baseGradient}`} />
      
      {/* Animated gradient overlays with theme colors - very subtle */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryRgba} 0%, transparent 50%, ${theme.secondaryRgba} 100%`,
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* Animated primary color orb - more visible */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${theme.primaryRgba.replace(/0\.\d+/, '0.20')}, transparent)`,
        }}
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* Animated secondary color orb - more visible */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${theme.secondaryRgba.replace(/0\.\d+/, '0.20')}, transparent)`,
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
      
      {/* More visible shimmer effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, transparent 30%, ${theme.shimmerColor.replace(/0\.\d+/, '0.08')} 50%, transparent 70%)`,
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 200%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
