import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeId, themes, getTheme } from '@/lib/themes'

interface ThemeSelectorProps {
  currentTheme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const currentThemeData = getTheme(currentTheme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 md:h-[46px] md:px-3 md:w-auto transition-all duration-200 relative overflow-hidden group border-2 hover:border-opacity-80 active:scale-95 rounded-lg"
          title={`Theme: ${currentThemeData.name}`}
          style={{
            borderColor: '#87CEEB80', // Baby blue border
            background: 'linear-gradient(135deg, #87CEEB15, #FFFFFF25)', // Baby blue to white gradient
          }}
        >
          {/* Shimmer effect on hover */}
          <div
            className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, #87CEEB30 50%, transparent 70%)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
          <div className="flex items-center gap-2 relative z-10">
            <Palette 
              className="h-[16.5px] w-[16.5px] transition-transform group-hover:rotate-12 text-[#5BA3D0]" 
            />
            <span 
              className="text-sm font-medium hidden md:inline-block text-[#5BA3D0]"
            >
              Theme
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Themes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.values(themes).map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-4 h-4 rounded-full border-2 border-border"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              />
              <div className="flex-1">
                <div className="font-medium">{theme.name}</div>
                <div className="text-xs text-muted-foreground">{theme.description}</div>
              </div>
              {currentTheme === theme.id && (
                <div className="text-primary">✓</div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
