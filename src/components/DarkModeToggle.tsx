import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DarkModeToggleProps {
  darkMode: boolean
  onToggle: () => void
}

export function DarkModeToggle({ darkMode, onToggle }: DarkModeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="transition-all"
    >
      {darkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}
