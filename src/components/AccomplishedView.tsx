import { useState } from 'react'
import { Trophy, ArrowLeft, Copy, Search, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Hunt } from '@/types'
import { formatDate, formatOdds } from '@/lib/utils'
import { ShinyDex } from './ShinyDex'

interface AccomplishedViewProps {
  hunts: Hunt[]
  onMoveToActive: (id: string) => void
  onDuplicate: (id: string) => void
  onSelectHunt?: (id: string) => void
  viewMode?: 'trophy-case' | 'shiny-dex'
}

export function AccomplishedView({
  hunts,
  onMoveToActive,
  onDuplicate,
  onSelectHunt,
}: AccomplishedViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const completedHunts = hunts
    .filter((h) => h.completed && !h.archived)
    .sort((a, b) => {
      const dateA = a.completedAt?.getTime() || 0
      const dateB = b.completedAt?.getTime() || 0
      return dateB - dateA // Most recently completed first
    })
    .filter((hunt) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return hunt.pokemon?.name.toLowerCase().includes(query) || 
             hunt.name.toLowerCase().includes(query)
    })

  const calculateDuration = (startDate: Date, endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (completedHunts.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold mb-2">No Completed Hunts Yet</h3>
        <p className="text-sm text-muted-foreground">
          Complete a hunt to see it here!
        </p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="trophy-case" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="trophy-case">Trophy Case</TabsTrigger>
        <TabsTrigger value="shiny-dex">Shiny Dex</TabsTrigger>
      </TabsList>

      <TabsContent value="trophy-case" className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Pokémon name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary" className="text-sm">
            {completedHunts.length} {completedHunts.length === 1 ? 'hunt' : 'hunts'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedHunts.map((hunt) => {
          const duration = hunt.completedAt && hunt.startDate
            ? calculateDuration(hunt.startDate, hunt.completedAt)
            : 0

          return (
            <Card
              key={hunt.id}
              className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-2 hover:border-primary/50 transition-all"
            >
              {/* Trophy decoration */}
              <div className="absolute top-2 right-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg capitalize">
                    {hunt.pokemon?.name || hunt.name}
                  </CardTitle>
                </div>
                {hunt.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Completed on {formatDate(hunt.completedAt)}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pokémon Display - Shiny + Greyed Base */}
                {hunt.pokemon && (
                  <div className="relative flex items-center justify-center gap-3">
                    {/* Shiny Image (Main) */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                      {hunt.pokemon.shinyImage ? (
                        <img
                          src={hunt.pokemon.shinyImage}
                          alt={`Shiny ${hunt.pokemon.name}`}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-lg flex items-center justify-center border-2 border-yellow-500/30">
                          <Sparkles className="h-8 w-8 text-yellow-500/40" />
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                    {/* Base Image (Greyed Thumbnail) */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 opacity-40 grayscale">
                      <img
                        src={hunt.pokemon.image}
                        alt={hunt.pokemon.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Total Attempts</p>
                    <p className="font-semibold">{hunt.endCount?.toLocaleString() || hunt.count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-semibold">{duration} {duration === 1 ? 'day' : 'days'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Method</p>
                    <p className="font-semibold">{hunt.method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Odds</p>
                    <p className="font-semibold">{formatOdds(hunt.oddsP)}</p>
                  </div>
                </div>

                {/* Start Date */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Started: {formatDate(hunt.startDate)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onMoveToActive(hunt.id)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Move to Active
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onDuplicate(hunt.id)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      </TabsContent>

      <TabsContent value="shiny-dex">
        <ShinyDex hunts={hunts} />
      </TabsContent>
    </Tabs>
  )
}
