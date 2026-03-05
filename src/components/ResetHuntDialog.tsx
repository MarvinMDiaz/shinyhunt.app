import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type ResetType = 'count-only' | 'whole-hunt'

interface ResetHuntDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  huntName: string
  onConfirm: (resetType: ResetType, options: ResetOptions) => void
}

export interface ResetOptions {
  keepHistory: boolean
  keepPokemon: boolean
  keepSettings: boolean
}

export function ResetHuntDialog({
  open,
  onOpenChange,
  huntName,
  onConfirm,
}: ResetHuntDialogProps) {
  const [resetType, setResetType] = useState<ResetType>('count-only')
  const [keepHistory, setKeepHistory] = useState(false)
  const [keepPokemon, setKeepPokemon] = useState(true)
  const [keepSettings, setKeepSettings] = useState(true)

  const handleConfirm = () => {
    onConfirm(resetType, {
      keepHistory,
      keepPokemon,
      keepSettings,
    })
    // Reset form
    setResetType('count-only')
    setKeepHistory(false)
    setKeepPokemon(true)
    setKeepSettings(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reset Hunt</DialogTitle>
          <DialogDescription>
            Choose how you want to reset "{huntName}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <RadioGroup value={resetType} onValueChange={(value) => setResetType(value as ResetType)}>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="count-only" id="count-only" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="count-only" className="font-medium cursor-pointer">
                    Reset Count Only
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reset count to 0 and optionally clear history. Keeps Pokémon, method, odds, goal, and start date.
                  </p>
                  {resetType === 'count-only' && (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keep-history-count"
                          checked={keepHistory}
                          onCheckedChange={(checked) => setKeepHistory(checked === true)}
                        />
                        <Label htmlFor="keep-history-count" className="text-sm font-normal cursor-pointer">
                          Keep history log
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                <RadioGroupItem value="whole-hunt" id="whole-hunt" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="whole-hunt" className="font-medium cursor-pointer">
                    Reset Whole Hunt (Start Over)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Reset count, clear history, and reset start date. Optionally keep Pokémon and settings.
                  </p>
                  {resetType === 'whole-hunt' && (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keep-pokemon"
                          checked={keepPokemon}
                          onCheckedChange={(checked) => setKeepPokemon(checked === true)}
                        />
                        <Label htmlFor="keep-pokemon" className="text-sm font-normal cursor-pointer">
                          Keep Pokémon selected
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="keep-settings"
                          checked={keepSettings}
                          onCheckedChange={(checked) => setKeepSettings(checked === true)}
                        />
                        <Label htmlFor="keep-settings" className="text-sm font-normal cursor-pointer">
                          Keep goal and odds settings
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
