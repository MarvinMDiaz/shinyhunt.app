import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DarkModeToggleProps {
  darkMode: boolean
  onToggle: () => void
}

export function DarkModeToggle({ darkMode, onToggle }: DarkModeToggleProps) {
  console.log('DarkModeToggle rendered, darkMode:', darkMode, 'onToggle exists:', !!onToggle)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('=== DARK MODE TOGGLE CLICKED ===')
    console.log('Current darkMode value:', darkMode)
    console.log('onToggle function:', onToggle)
    
    try {
      if (typeof onToggle === 'function') {
        console.log('Calling onToggle function...')
        onToggle()
        console.log('onToggle function called successfully')
      } else {
        console.error('onToggle is not a function!', typeof onToggle)
      }
    } catch (error) {
      console.error('Error calling onToggle:', error)
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
