import { useState, useEffect } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Copy, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const DEFAULT_PROGRESS_COLOR = '#22c55e'

interface ProgressColorPickerProps {
  color: string | undefined
  onChange: (color: string) => void
}

export function ProgressColorPicker({ color, onChange }: ProgressColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [localColor, setLocalColor] = useState(color || DEFAULT_PROGRESS_COLOR)
  const { toast } = useToast()

  const currentColor = color || DEFAULT_PROGRESS_COLOR
  const isDefault = currentColor === DEFAULT_PROGRESS_COLOR

  // Sync localColor when color prop changes
  useEffect(() => {
    setLocalColor(color || DEFAULT_PROGRESS_COLOR)
  }, [color])

  const handleColorChange = (newColor: string) => {
    setLocalColor(newColor)
    onChange(newColor)
  }

  const handleReset = () => {
    setLocalColor(DEFAULT_PROGRESS_COLOR)
    onChange(DEFAULT_PROGRESS_COLOR)
    toast({
      title: 'Color reset',
      description: 'Progress bar color reset to default green.',
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentColor)
    toast({
      title: 'Copied!',
      description: `Color ${currentColor} copied to clipboard.`,
    })
  }

  const isValidHex = (hex: string) => {
    return /^#[0-9A-F]{6}$/i.test(hex)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-2 shrink-0"
          style={{ backgroundColor: currentColor }}
          title="Change progress bar color"
        >
          <span className="sr-only">Pick color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Progress Bar Color</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <HexColorInput
                  color={localColor}
                  onChange={handleColorChange}
                  prefixed
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !isValidHex(localColor) && 'border-destructive'
                  )}
                  placeholder="#22c55e"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-10 px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <HexColorPicker
            color={localColor}
            onChange={handleColorChange}
            style={{ width: '200px', height: '200px' }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full"
            disabled={isDefault}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
