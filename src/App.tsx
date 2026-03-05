import { useState, useEffect } from 'react'
import { Home, Save, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HuntSwitcher } from '@/components/HuntSwitcher'
import { CreateHuntDialog } from '@/components/CreateHuntDialog'
import { RenameHuntDialog } from '@/components/RenameHuntDialog'
import { DeleteHuntDialog } from '@/components/DeleteHuntDialog'
import { CompleteHuntDialog } from '@/components/CompleteHuntDialog'
import { ResetHuntDialog, ResetType, ResetOptions } from '@/components/ResetHuntDialog'
import { HuntDetails } from '@/components/HuntDetails'
import { ProgressPanelV3 } from '@/components/ProgressPanelV3'
import { Statistics } from '@/components/Statistics'
import { SessionHeatMapCard } from '@/components/SessionHeatMapCard'
import { AccomplishedView } from '@/components/AccomplishedView'
import { PokemonDisplay } from '@/components/PokemonDisplay'
import { LandingPage } from '@/components/LandingPage'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { loadState, saveState } from '@/lib/storage'
import { Hunt, AppState, HistoryEntry } from '@/types'

function App() {
  const [state, setState] = useState<AppState>(loadState())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [renameHuntId, setRenameHuntId] = useState<string | null>(null)
  const [deleteHuntId, setDeleteHuntId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  const [resetSnapshot, setResetSnapshot] = useState<Hunt | null>(null)
  const [showLandingPage, setShowLandingPage] = useState(false)
  const { toast } = useToast()

  // Apply dark mode
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [state.darkMode])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(state)
  }, [state])

  const currentHunt = state.hunts.find((h) => h.id === state.currentHuntId)

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const updateHunt = (id: string, updates: Partial<Hunt>) => {
    console.log('[App] updateHunt called:', { id, updates })
    setState((prev) => {
      const updated = {
        ...prev,
        hunts: prev.hunts.map((h) => {
          if (h.id === id) {
            const merged = { ...h, ...updates }
            console.log('[App] Updated hunt:', { id, oldGoal: h.goal, newGoal: merged.goal })
            return merged
          }
          return h
        }),
      }
      return updated
    })
  }

  const createHunt = (name: string) => {
    const newHunt: Hunt = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
      startDate: new Date(),
      pokemon: null,
      method: '',
      oddsP: 1 / 4096,
      goal: 0,
      count: 0,
      history: [],
      completed: false,
      continueCounting: false,
    }
    setState((prev) => ({
      ...prev,
      hunts: [...prev.hunts, newHunt],
      currentHuntId: newHunt.id,
    }))
    setActiveTab('active')
    setShowLandingPage(false)
    toast({
      title: 'Hunt created',
      description: `"${name}" has been created.`,
    })
  }

  const startHunting = () => {
    // Create a default hunt and go directly to tracker
    const defaultHunt: Hunt = {
      id: crypto.randomUUID(),
      name: 'My First Hunt',
      createdAt: new Date(),
      startDate: new Date(),
      pokemon: null,
      method: '',
      oddsP: 1 / 4096,
      goal: 0,
      count: 0,
      history: [],
      completed: false,
      continueCounting: false,
    }
    setState((prev) => ({
      ...prev,
      hunts: [...prev.hunts, defaultHunt],
      currentHuntId: defaultHunt.id,
    }))
    setShowLandingPage(false)
    setActiveTab('active')
  }

  const duplicateHunt = (id: string) => {
    const hunt = state.hunts.find((h) => h.id === id)
    if (!hunt) return

    const duplicated: Hunt = {
      ...hunt,
      id: crypto.randomUUID(),
      name: `${hunt.name} (Copy)`,
      createdAt: new Date(),
      startDate: new Date(),
      count: 0,
      history: [],
      completed: false,
      completedAt: undefined,
      endCount: undefined,
      continueCounting: false,
    }
    setState((prev) => ({
      ...prev,
      hunts: [...prev.hunts, duplicated],
      currentHuntId: duplicated.id,
    }))
    setActiveTab('active')
    toast({
      title: 'Hunt duplicated',
      description: `"${duplicated.name}" has been created.`,
    })
  }

  const renameHunt = (id: string, name: string) => {
    updateHunt(id, { name })
    toast({
      title: 'Hunt renamed',
      description: `Hunt renamed to "${name}".`,
    })
  }

  const archiveHunt = (id: string) => {
    updateHunt(id, { archived: true })
    if (state.currentHuntId === id) {
      const activeHunts = state.hunts.filter((h) => !h.archived && h.id !== id)
      setState((prev) => ({
        ...prev,
        currentHuntId: activeHunts.length > 0 ? activeHunts[0].id : null,
      }))
    }
    toast({
      title: 'Hunt archived',
      description: 'Hunt has been archived.',
    })
  }

  const deleteHunt = (id: string) => {
    setState((prev) => {
      const newHunts = prev.hunts.filter((h) => h.id !== id)
      return {
        ...prev,
        hunts: newHunts,
        currentHuntId:
          prev.currentHuntId === id
            ? newHunts.length > 0
              ? newHunts[0].id
              : null
            : prev.currentHuntId,
      }
    })
    toast({
      title: 'Hunt deleted',
      description: 'Hunt has been deleted.',
    })
  }

  const incrementCount = (delta: number) => {
    if (!currentHunt) return
    if (currentHunt.completed && !currentHunt.continueCounting) return

    const newCount = currentHunt.count + delta
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      delta,
      countBefore: currentHunt.count,
      countAfter: newCount,
    }

    updateHunt(currentHunt.id, {
      count: newCount,
      history: [...currentHunt.history, entry],
    })
  }

  const setCount = (newCount: number) => {
    if (!currentHunt) return
    if (currentHunt.completed && !currentHunt.continueCounting) return

    const delta = newCount - currentHunt.count
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      delta,
      countBefore: currentHunt.count,
      countAfter: newCount,
    }

    updateHunt(currentHunt.id, {
      count: newCount,
      history: [...currentHunt.history, entry],
    })
  }

  const completeHunt = (continueCounting: boolean) => {
    if (!currentHunt) return

    updateHunt(currentHunt.id, {
      completed: true,
      completedAt: new Date(),
      endCount: currentHunt.count,
      continueCounting,
    })
    toast({
      title: 'Hunt completed!',
      description: `"${currentHunt.name}" has been marked as completed.`,
    })
    setActiveTab('accomplished')
  }

  const uncompleteHunt = (id: string) => {
    updateHunt(id, {
      completed: false,
      completedAt: undefined,
      endCount: undefined,
      continueCounting: false,
    })
    toast({
      title: 'Hunt moved to active',
      description: 'Hunt has been moved back to active hunts.',
    })
    setActiveTab('active')
    if (state.currentHuntId !== id) {
      updateState({ currentHuntId: id })
    }
  }

  const undoLastAction = () => {
    if (!currentHunt || currentHunt.history.length === 0) return

    const lastEntry = currentHunt.history[currentHunt.history.length - 1]
    updateHunt(currentHunt.id, {
      count: lastEntry.countBefore,
      history: currentHunt.history.slice(0, -1),
    })
    toast({
      title: 'Action undone',
      description: `Reverted ${lastEntry.delta > 0 ? '+' : ''}${lastEntry.delta}.`,
    })
  }

  const resetHunt = (resetType: ResetType, options: ResetOptions) => {
    if (!currentHunt) return

    // Store snapshot for undo (deep copy)
    const snapshot: Hunt = JSON.parse(JSON.stringify(currentHunt))
    setResetSnapshot(snapshot)

    if (resetType === 'count-only') {
      updateHunt(currentHunt.id, {
        count: 0,
        history: options.keepHistory ? currentHunt.history : [],
      })
    } else {
      // Reset whole hunt
      const updates: Partial<Hunt> = {
        count: 0,
        history: [],
        startDate: new Date(),
      }

      if (!options.keepPokemon) {
        updates.pokemon = null
      }

      if (!options.keepSettings) {
        updates.goal = 0
        updates.oddsP = 1 / 4096
      }

      updateHunt(currentHunt.id, updates)
    }

    const toastId = toast({
      title: 'Reset complete',
      description: resetType === 'count-only' ? 'Count has been reset.' : 'Hunt has been reset.',
      action: (
        <button
          onClick={() => {
            if (snapshot) {
              // Restore all fields from snapshot
              updateHunt(currentHunt.id, snapshot)
              setResetSnapshot(null)
              toast({
                title: 'Reset undone',
                description: 'Hunt has been restored.',
              })
            }
          }}
          className="text-primary hover:underline font-medium"
        >
          Undo
        </button>
      ),
    })
  }


  const activeHunts = state.hunts.filter((h) => !h.completed && !h.archived)
  const completedHunts = state.hunts.filter((h) => h.completed && !h.archived)
  const hasAnyHunts = state.hunts.length > 0

  if (!hasAnyHunts || showLandingPage) {
    return (
      <>
        <LandingPage
          onStartHunting={startHunting}
          onViewTrophyCase={() => {
            if (hasAnyHunts) {
              setShowLandingPage(false)
              setActiveTab('accomplished')
            } else {
              startHunting()
            }
          }}
          completedHuntsCount={completedHunts.length}
        />
        <Toaster />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLandingPage(true)}
              className="h-9 w-9"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="ShinyHunt.app" 
                className="h-32 md:h-40 w-auto"
              />
            </div>
            {activeTab === 'active' && activeHunts.length > 0 && (
              <HuntSwitcher
                hunts={state.hunts}
                currentHuntId={state.currentHuntId}
                onSelectHunt={(id) => {
                  updateState({ currentHuntId: id })
                  setActiveTab('active')
                }}
                onCreateHunt={() => setCreateDialogOpen(true)}
                onDuplicateHunt={duplicateHunt}
                onRenameHunt={(id) => {
                  setRenameHuntId(id)
                  setRenameDialogOpen(true)
                }}
                onArchiveHunt={archiveHunt}
                onDeleteHunt={(id) => {
                  setDeleteHuntId(id)
                  setDeleteDialogOpen(true)
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-4">
            {currentHunt && (!currentHunt.name || currentHunt.name === 'My First Hunt') && (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={currentHunt.name || ''}
                  onChange={(e) => {
                    if (currentHunt) {
                      updateHunt(currentHunt.id, { name: e.target.value })
                    }
                  }}
                  placeholder="Enter hunt name..."
                  className="w-48 h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentHunt && (currentHunt.name?.trim() || e.currentTarget.value.trim())) {
                      const newName = e.currentTarget.value.trim() || currentHunt.name?.trim() || ''
                      if (newName) {
                        updateHunt(currentHunt.id, { name: newName })
                        toast({
                          title: 'Profile saved',
                          description: `Hunt "${newName}" has been saved.`,
                        })
                      }
                    }
                  }}
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (currentHunt && currentHunt.name?.trim()) {
                      toast({
                        title: 'Profile saved',
                        description: `Hunt "${currentHunt.name}" has been saved.`,
                      })
                    }
                  }}
                  disabled={!currentHunt?.name?.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            )}
            <DarkModeToggle
              darkMode={state.darkMode}
              onToggle={() => updateState({ darkMode: !state.darkMode })}
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Hunts</TabsTrigger>
            <TabsTrigger value="accomplished">Accomplished</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeHunts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <p className="text-muted-foreground text-lg text-center">
                  No active hunts. Create one to get started!
                </p>
                <Button
                  size="lg"
                  onClick={() => setCreateDialogOpen(true)}
                  className="h-12 px-8"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Hunt
                </Button>
              </div>
            ) : currentHunt && !currentHunt.completed ? (
              <div className="flex flex-col lg:grid lg:grid-cols-[420px_1fr] lg:gap-6 lg:w-full lg:max-w-none">
                {/* Left Column: Hunt Details + Monthly Activity (Desktop) */}
                {/* Desktop: Hunt Details → Monthly Activity */}
                {/* Mobile order: Preview (order-1) → Progress (order-2) → Statistics (order-3) → Hunt Details (order-4) → Monthly Activity (order-5) */}
                <div className="order-4 lg:order-1 flex flex-col gap-6">
                  {/* Hunt Details - Fourth on mobile, first on desktop */}
                  <HuntDetails
                    hunt={currentHunt}
                    onUpdate={(updates) => updateHunt(currentHunt.id, updates)}
                  />

                  {/* Monthly Activity - Fifth on mobile, second on desktop */}
                  <div className="order-5 lg:order-2">
                    <SessionHeatMapCard history={currentHunt.history} />
                  </div>
                </div>

                {/* Right Column: Preview + Progress + Statistics (Desktop) */}
                {/* Desktop order: Preview → Progress → Statistics */}
                {/* Mobile: Preview (order-1) → Progress (order-2) → Statistics (order-3) */}
                <div className="order-1 lg:order-2 flex flex-col gap-6">
                  {/* Pokémon Display Header - First on desktop, first on mobile */}
                  {currentHunt.pokemon && (
                    <Card>
                      <CardContent className="p-6">
                        <PokemonDisplay
                          pokemon={currentHunt.pokemon}
                          completed={currentHunt.completed === true}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress Panel - Second on desktop, second on mobile */}
                  <ProgressPanelV3
                    hunt={currentHunt}
                    onIncrement={incrementCount}
                    onSetCount={setCount}
                    onUndo={undoLastAction}
                    onComplete={() => setCompleteDialogOpen(true)}
                    onReset={() => setResetDialogOpen(true)}
                    onUpdate={(updates) => updateHunt(currentHunt.id, updates)}
                  />

                  {/* Statistics - Third on desktop, third on mobile */}
                  <Statistics hunt={currentHunt} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <p className="text-muted-foreground text-lg text-center">
                  Select an active hunt or create a new one.
                </p>
                <Button
                  size="lg"
                  onClick={() => setCreateDialogOpen(true)}
                  className="h-12 px-8"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Hunt
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accomplished">
            <AccomplishedView
              hunts={state.hunts}
              onMoveToActive={uncompleteHunt}
              onDuplicate={duplicateHunt}
              onSelectHunt={(id) => {
                updateState({ currentHuntId: id })
                setActiveTab('active')
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      <CreateHuntDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createHunt}
      />

      {renameHuntId && (
        <RenameHuntDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          currentName={
            state.hunts.find((h) => h.id === renameHuntId)?.name || ''
          }
          onRename={(name) => {
            renameHunt(renameHuntId, name)
            setRenameHuntId(null)
          }}
        />
      )}

      {deleteHuntId && (
        <DeleteHuntDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          huntName={
            state.hunts.find((h) => h.id === deleteHuntId)?.name || ''
          }
          onConfirm={() => {
            deleteHunt(deleteHuntId)
            setDeleteHuntId(null)
          }}
        />
      )}

      {currentHunt && (
        <>
          <CompleteHuntDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            huntName={currentHunt.name}
            onConfirm={completeHunt}
          />
          <ResetHuntDialog
            open={resetDialogOpen}
            onOpenChange={setResetDialogOpen}
            huntName={currentHunt.name}
            onConfirm={resetHunt}
          />
        </>
      )}

      <Toaster />
    </div>
  )
}

export default App
