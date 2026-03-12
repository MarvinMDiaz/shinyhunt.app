export type ThemeId = 'default' | 'purple' | 'ocean' | 'forest' | 'sunset'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  baseGradient: string
  primaryColor: string
  secondaryColor: string
  primaryRgba: string
  secondaryRgba: string
  shimmerColor: string
}

export const themes: Record<ThemeId, Theme> = {
  default: {
    id: 'default',
    name: 'Shiny Gold',
    description: 'Classic golden yellow and cyan',
    baseGradient: 'from-background via-background to-muted/30',
    primaryColor: '#FFE44D', // Brighter golden yellow
    secondaryColor: '#00E5E8', // Brighter cyan
    primaryRgba: 'rgba(255, 228, 77, 0.15)', // Increased brightness
    secondaryRgba: 'rgba(0, 229, 232, 0.15)', // Increased brightness
    shimmerColor: 'rgba(255, 228, 77, 0.08)', // Increased brightness
  },
  purple: {
    id: 'purple',
    name: 'Sinnoh Purple',
    description: 'Purple and indigo like the landing page',
    baseGradient: 'from-purple-800/50 via-indigo-800/40 to-purple-700/50', // Brighter gradients
    primaryColor: '#C084FC', // Brighter purple
    secondaryColor: '#818CF8', // Brighter indigo
    primaryRgba: 'rgba(192, 132, 252, 0.18)', // Increased brightness
    secondaryRgba: 'rgba(129, 140, 248, 0.18)', // Increased brightness
    shimmerColor: 'rgba(192, 132, 252, 0.08)', // Increased brightness
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Deep blue and teal waves',
    baseGradient: 'from-blue-800/50 via-cyan-800/40 to-teal-700/50', // Brighter gradients
    primaryColor: '#38BDF8', // Brighter sky blue
    secondaryColor: '#2DD4BF', // Brighter teal
    primaryRgba: 'rgba(56, 189, 248, 0.18)', // Increased brightness
    secondaryRgba: 'rgba(45, 212, 191, 0.18)', // Increased brightness
    shimmerColor: 'rgba(56, 189, 248, 0.08)', // Increased brightness
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    description: 'Emerald and lime greens',
    baseGradient: 'from-green-800/50 via-emerald-800/40 to-lime-700/50', // Brighter gradients
    primaryColor: '#34D399', // Brighter emerald
    secondaryColor: '#A3E635', // Brighter lime
    primaryRgba: 'rgba(52, 211, 153, 0.18)', // Increased brightness
    secondaryRgba: 'rgba(163, 230, 53, 0.18)', // Increased brightness
    shimmerColor: 'rgba(52, 211, 153, 0.08)', // Increased brightness
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm orange and pink tones',
    baseGradient: 'from-orange-800/50 via-rose-800/40 to-pink-700/50', // Brighter gradients
    primaryColor: '#FB923C', // Brighter orange
    secondaryColor: '#F472B6', // Brighter pink
    primaryRgba: 'rgba(251, 146, 60, 0.18)', // Increased brightness
    secondaryRgba: 'rgba(244, 114, 182, 0.18)', // Increased brightness
    shimmerColor: 'rgba(251, 146, 60, 0.08)', // Increased brightness
  },
}

export function getTheme(themeId: ThemeId): Theme {
  return themes[themeId] || themes.default
}
