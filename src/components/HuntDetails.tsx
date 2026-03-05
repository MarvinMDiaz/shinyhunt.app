import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon } from 'lucide-react'
import { formatDate, parseOdds, formatOdds } from '@/lib/utils'
import { Hunt, Pokemon } from '@/types'
import { PokemonSearch } from './PokemonSearch'

interface HuntDetailsProps {
  hunt: Hunt
  onUpdate: (updates: Partial<Hunt>) => void
}

const METHODS = [
  'Random Encounter',
  'Masuda Method',
  'Chain Fishing',
  'SOS Chaining',
  'Dynamax Adventures',
  'Outbreak',
  'Sandwich',
  'Other',
]

const COMMON_ODDS = [
  { label: '1/4096', value: 1 / 4096 },
  { label: '1/2048', value: 1 / 2048 },
  { label: '1/1365', value: 1 / 1365 },
  { label: '1/8192', value: 1 / 8192 },
]

export function HuntDetails({ hunt, onUpdate }: HuntDetailsProps) {
  const [oddsInput, setOddsInput] = useState(formatOdds(hunt.oddsP))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [goalInput, setGoalInput] = useState<string>(hunt.goal?.toString() || '')

  // Sync goalInput with hunt.goal when hunt changes
  useEffect(() => {
    setGoalInput(hunt.goal?.toString() || '')
  }, [hunt.goal])

  const handleOddsChange = (value: string) => {
    setOddsInput(value)
    const odds = parseOdds(value)
    if (odds > 0 && odds <= 1) {
      onUpdate({ oddsP: odds })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hunt Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Pokémon</Label>
          <PokemonSearch
            selected={hunt.pokemon}
            onSelect={(pokemon: Pokemon) => onUpdate({ pokemon })}
          />
        </div>

        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {hunt.startDate ? formatDate(hunt.startDate) : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                selected={hunt.startDate}
                onSelect={(date) => {
                  if (date) {
                    onUpdate({ startDate: date })
                    setCalendarOpen(false)
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Method</Label>
          <select
            value={hunt.method}
            onChange={(e) => onUpdate({ method: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select method...</option>
            {METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Shiny Odds</Label>
          <div className="flex gap-2 mb-2">
            {COMMON_ODDS.map(({ label, value }) => (
              <Button
                key={label}
                variant={Math.abs(hunt.oddsP - value) < 0.000001 ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  onUpdate({ oddsP: value })
                  setOddsInput(label)
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <Input
            value={oddsInput}
            onChange={(e) => handleOddsChange(e.target.value)}
            placeholder="e.g., 1/4096 or 0.000244"
          />
        </div>

        <div className="space-y-2">
          <Label>Goal</Label>
          <Input
            type="number"
            value={goalInput}
            onChange={(e) => {
              const value = e.target.value
              setGoalInput(value)
              // Save immediately as user types
              if (value === '') {
                onUpdate({ goal: 0 })
              } else {
                const numValue = parseInt(value, 10)
                if (!isNaN(numValue) && numValue >= 0) {
                  console.log('[HuntDetails] Setting goal to:', numValue)
                  onUpdate({ goal: numValue })
                }
              }
            }}
            onBlur={(e) => {
              const value = e.target.value.trim()
              if (value === '') {
                onUpdate({ goal: 0 })
                setGoalInput('')
              } else {
                const numValue = parseInt(value, 10)
                if (!isNaN(numValue) && numValue >= 0) {
                  console.log('[HuntDetails] Final goal on blur:', numValue)
                  onUpdate({ goal: numValue })
                  setGoalInput(numValue.toString())
                } else {
                  setGoalInput(hunt.goal?.toString() || '')
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            placeholder="Target number of encounters (e.g., 10000)"
            min="0"
          />
          {hunt.goal > 0 && (
            <p className="text-xs text-green-500">
              ✓ Goal set: {hunt.goal.toLocaleString()} encounters
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
