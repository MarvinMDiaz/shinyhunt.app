import { motion } from 'framer-motion'

export function BrandedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {/* Light mode: soft cosmic gradient with subtle gray/blue tint (reduces washed-out feel) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-indigo-50/95 to-cyan-50 dark:hidden" />
      {/* Dark mode: Sinnoh purple blended with brand colors */}
      <div className="absolute inset-0 hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 dark:block" />
      
      {/* Animated gradient overlays with brand colors - subtle, reduced in light mode for contrast */}
      <motion.div
        className="absolute inset-0 opacity-40 dark:opacity-100"
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
      
      {/* Animated golden orb - subtle, reduced in light mode */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-50 dark:opacity-100"
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
      
      {/* Animated cyan orb - subtle, reduced in light mode */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-50 dark:opacity-100"
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
      
      {/* Additional shimmer effect - very subtle, reduced in light mode */}
      <motion.div
        className="absolute inset-0 opacity-50 dark:opacity-100"
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
      
      {/* Dark overlay for text readability - dark mode only */}
      <div className="absolute inset-0 hidden bg-gradient-to-b from-black/70 via-black/75 to-black/85 dark:block" />
    </div>
  )
}
