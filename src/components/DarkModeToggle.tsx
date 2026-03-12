import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

interface DarkModeToggleProps {
  darkMode: boolean
  onToggle: () => void
}

export function DarkModeToggle({ darkMode, onToggle }: DarkModeToggleProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (typeof onToggle === 'function') {
        onToggle()
      } else {
        logger.error('onToggle is not a function')
      }
    } catch (error) {
      logger.error('Error calling onToggle')
    }
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-10 w-10 md:h-[46px] md:w-[46px] shrink-0 p-0 relative z-[60] rounded-lg transition-all duration-200 active:scale-95"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      type="button"
      style={{ 
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 9999
      }}
    >
      {darkMode ? (
        <Sun 
          className="h-[16.5px] w-[16.5px] md:h-[25.75px] md:w-[25.75px]" 
          style={{ color: '#FFD700', pointerEvents: 'none' }} // Golden yellow
        />
      ) : (
        <Moon 
          className="h-[16.5px] w-[16.5px] md:h-[25.75px] md:w-[25.75px]" 
          style={{ color: '#6B8FAF', pointerEvents: 'none' }} // Greyish blue
        />
      )}
    </Button>
  )
}
