import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SEO } from '@/components/SEO'
import { fetchPokemon, searchPokemon } from '@/lib/pokeapi'
import { loadGames, getGameById } from '@/lib/games'
import { Pokemon } from '@/types'
import { formatOdds } from '@/lib/utils'
import { pokemonNameToSlug, slugToPokemonName } from '@/lib/pokemonSlugs'
import { Sparkles, ArrowLeft, Target, RotateCcw, Search, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { logger } from '@/lib/logger'
import type { Game } from '@/constants/defaultGames'

/**
 * Get standard shiny odds for different methods
 */
function getShinyOdds(method: string): number {
  const oddsMap: Record<string, number> = {
    'full-odds': 1 / 4096,
    'masuda': 1 / 683,
    'charm': 1 / 1365,
    'charm-masuda': 1 / 512,
    'sos': 1 / 4096, // Can be boosted with chain
    'chain-fishing': 1 / 4096, // Improves with chain
    'horde': 1 / 819, // 5 encounters at once
    'dex-nav': 1 / 512, // With search level
    'friend-safari': 1 / 512,
    'ultra-wormhole': 1 / 100, // Ultra Space
    'dynamax-adventure': 1 / 100,
    'outbreak': 1 / 158, // Mass outbreaks (Legends Arceus)
    'sandwich': 1 / 1024, // With Sparkling Power level 3 (Scarlet/Violet)
    'soft-reset': 1 / 4096,
    'random-encounter': 1 / 4096,
  }
  return oddsMap[method.toLowerCase()] || 1 / 4096
}

/**
 * Get Pokémon generation from ID
 * Gen 1: 1-151, Gen 2: 152-251, Gen 3: 252-386, etc.
 */
function getPokemonGeneration(pokemonId: number): number {
  if (pokemonId <= 151) return 1
  if (pokemonId <= 251) return 2
  if (pokemonId <= 386) return 3
  if (pokemonId <= 493) return 4
  if (pokemonId <= 649) return 5
  if (pokemonId <= 721) return 6
  if (pokemonId <= 809) return 7
  if (pokemonId <= 905) return 8
  return 9
}

/**
 * Get base shiny odds based on generation
 * Gen 1-5: 1/8192, Gen 6+: 1/4096
 */
function getBaseShinyOdds(generation: number): number {
  return generation <= 5 ? 1 / 8192 : 1 / 4096
}

/**
 * Get available hunt methods for a Pokémon
 */
function getAvailableMethods(pokemonId: number, games: Game[], selectedGen: number | null): Array<{ method: string; name: string; odds: number; description: string }> {
  const methods: Array<{ method: string; name: string; odds: number; description: string }> = []
  const pokemonGeneration = getPokemonGeneration(pokemonId)
  // Use selected generation if provided, otherwise use Pokémon's generation
  const generation = selectedGen !== null ? selectedGen : pokemonGeneration
  const baseOdds = getBaseShinyOdds(generation)
  const baseOddsDisplay = generation <= 5 ? '1/8192' : '1/4096'
  
  // Standard methods available in most games
  methods.push({
    method: 'full-odds',
    name: 'Full Odds',
    odds: baseOdds,
    description: `Standard shiny odds without any modifiers (${baseOddsDisplay} in Gen ${generation <= 5 ? '1-5' : '6+'})`
  })
  
  methods.push({
    method: 'soft-reset',
    name: 'Soft Reset',
    odds: baseOdds,
    description: `Reset for static encounters or legendaries (${baseOddsDisplay} in Gen ${generation <= 5 ? '1-5' : '6+'})`
  })
  
  methods.push({
    method: 'random-encounter',
    name: 'Random Encounter',
    odds: baseOdds,
    description: `Standard random encounters in grass/caves (${baseOddsDisplay} in Gen ${generation <= 5 ? '1-5' : '6+'})`
  })
  
  // Method-specific based on games
  const gameIds = games.map(g => g.id)
  
  if (gameIds.some(id => id.includes('x') || id.includes('y') || id.includes('omega') || id.includes('alpha'))) {
    methods.push({
      method: 'masuda',
      name: 'Masuda Method',
      odds: 1 / 683,
      description: 'Breeding with Pokémon from different language games'
    })
    
    methods.push({
      method: 'charm',
      name: 'Shiny Charm',
      odds: 1 / 1365,
      description: 'With Shiny Charm item'
    })
    
    methods.push({
      method: 'charm-masuda',
      name: 'Masuda + Charm',
      odds: 1 / 512,
      description: 'Masuda Method with Shiny Charm'
    })
    
    methods.push({
      method: 'horde',
      name: 'Horde Encounter',
      odds: 1 / 819,
      description: 'Horde battles (5 Pokémon at once)'
    })
    
    methods.push({
      method: 'dex-nav',
      name: 'DexNav',
      odds: 1 / 512,
      description: 'Using DexNav search feature'
    })
    
    methods.push({
      method: 'friend-safari',
      name: 'Friend Safari',
      odds: 1 / 512,
      description: 'Friend Safari encounters'
    })
  }
  
  if (gameIds.some(id => id.includes('sun') || id.includes('moon') || id.includes('ultra'))) {
    methods.push({
      method: 'sos',
      name: 'SOS Chaining',
      odds: 1 / 4096,
      description: 'SOS battle chaining (odds improve with chain)'
    })
  }
  
  if (gameIds.some(id => id.includes('ultra'))) {
    methods.push({
      method: 'ultra-wormhole',
      name: 'Ultra Wormhole',
      odds: 1 / 100,
      description: 'Ultra Space wormhole encounters'
    })
  }
  
  if (gameIds.some(id => id.includes('sword') || id.includes('shield') || id.includes('scarlet') || id.includes('violet'))) {
    methods.push({
      method: 'dynamax-adventure',
      name: 'Dynamax Adventure',
      odds: 1 / 100,
      description: 'Dynamax Adventures (Sword/Shield)'
    })
  }
  
  if (gameIds.some(id => id.includes('legends') || id.includes('arceus'))) {
    methods.push({
      method: 'outbreak',
      name: 'Mass Outbreak',
      odds: 1 / 158,
      description: 'Mass outbreaks in Legends: Arceus'
    })
  }
  
  if (gameIds.some(id => id.includes('scarlet') || id.includes('violet'))) {
    methods.push({
      method: 'sandwich',
      name: 'Sparkling Power',
      odds: 1 / 1024,
      description: 'With Sparkling Power level 3 sandwich'
    })
  }
  
  return methods
}

export function PokemonHuntPage() {
  const params = useParams<{ 'pokemon-name-shiny-hunt': string }>()
  const slug = params['pokemon-name-shiny-hunt']
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [pokemon, setPokemon] = useState<Pokemon | null>(null)
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState<Game[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>('full-odds')
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null) // null = auto-detect from Pokémon
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Pokemon[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTimeoutRef = useRef<number | undefined>()
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Extract Pokémon name from slug
  const pokemonName = slug ? slugToPokemonName(slug) : null
  
  useEffect(() => {
    // Reset state when slug changes
    setPokemon(null)
    setLoading(true)
    setSelectedMethod('full-odds')
    setSelectedGeneration(null) // Reset to auto-detect
    
    async function loadData() {
      if (!pokemonName) {
        setLoading(false)
        return
      }
      
      try {
        // Load games
        const loadedGames = await loadGames()
        setGames(loadedGames)
        
        // Fetch Pokémon data by name (not ID)
        const pokemonData = await fetchPokemon(pokemonName)
        if (pokemonData) {
          setPokemon(pokemonData)
        } else {
          logger.error('Failed to fetch Pokémon data')
        }
      } catch (error) {
        logger.error('Error loading Pokémon hunt page')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [slug, pokemonName]) // Depend on slug to reset when URL changes
  
  // Handle search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }
    
    setSearchLoading(true)
    searchTimeoutRef.current = window.setTimeout(async () => {
      const results = await searchPokemon(searchQuery)
      setSearchResults(results)
      setSearchLoading(false)
      setSearchOpen(results.length > 0)
    }, 300)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])
  
  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSearchSelect = (pokemon: Pokemon) => {
    const slug = pokemonNameToSlug(pokemon.name)
    navigate(`/pokemon/${slug}`)
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
  }
  
  const handleStartHunt = () => {
    if (!isAuthenticated) {
      navigate('/signup')
      return
    }
    
    // Navigate to tracker with Pokémon pre-selected
    navigate(`/tracker?pokemon=${pokemon?.name || pokemonName}`)
  }
  
  if (loading) {
    return (
      <>
        <SEO
          title={`Shiny ${pokemonName ? pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1) : 'Pokémon'} Hunt Tracker | ShinyHunt`}
          description={`Track your shiny ${pokemonName || 'Pokémon'} hunt with reset counters and shiny odds using ShinyHunt.`}
          canonicalUrl={`https://www.shinyhunt.app/pokemon/${slug || ''}`}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Pokémon data...</p>
          </div>
        </div>
      </>
    )
  }
  
  if (!pokemon || !pokemonName) {
    return (
      <>
        <SEO
          title="Pokémon Not Found | ShinyHunt"
          description="Pokémon hunt page not found."
          canonicalUrl={`https://www.shinyhunt.app/pokemon/${slug || ''}`}
          noindex={true}
        />
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Pokémon Not Found</CardTitle>
              <CardDescription>The Pokémon you're looking for doesn't exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }
  
  const displayName = pokemon.displayName || pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)
  const pokemonGeneration = getPokemonGeneration(pokemon.id)
  const methods = getAvailableMethods(pokemon.id, games, selectedGeneration)
  const selectedMethodData = methods.find(m => m.method === selectedMethod) || methods[0]
  
  // Available generation options (Gen 1-5 and Gen 6+)
  const generationOptions = [
    { label: 'Gen 1-5 (1/8192)', value: 1 },
    { label: 'Gen 6+ (1/4096)', value: 6 },
  ]
  
  return (
    <>
      <SEO
        title={`Shiny ${displayName} Hunt Tracker | ShinyHunt`}
        description={`Track your Shiny ${displayName} hunt with reset counters and shiny odds using ShinyHunt. Find the best methods to hunt shiny ${displayName} and track your progress.`}
        canonicalUrl={`https://www.shinyhunt.app/pokemon/${pokemonNameToSlug(pokemon.name)}`}
        ogImage={pokemon.shinyImage || pokemon.image}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            {/* Pokémon Search */}
            <div ref={searchRef} className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for any Pokémon (e.g., 'pikachu', 'charizard', '#25')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setSearchOpen(true)
                    }
                  }}
                />
              </div>
              {searchOpen && (
                <Card className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto shadow-lg">
                  {searchLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-2">
                      {searchResults.map((pokemon, index) => (
                        <Button
                          key={pokemon.formName || `${pokemon.id}-${index}`}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleSearchSelect(pokemon)}
                        >
                          <img
                            src={pokemon.image}
                            alt={pokemon.displayName || pokemon.name}
                            className="h-8 w-8 mr-2"
                            loading="lazy"
                          />
                          <span className="capitalize">
                            {pokemon.displayName || pokemon.name}
                          </span>
                          <span className="ml-auto text-muted-foreground">#{pokemon.id}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No Pokémon found
                    </div>
                  )}
                </Card>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Shiny {displayName} Hunt Tracker
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your shiny {displayName} hunt with reset counters and shiny odds
            </p>
          </div>
          
          {/* Pokémon Sprites */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pokémon Sprites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Regular Sprite */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-3">Regular {displayName}</h3>
                  {pokemon.image ? (
                    <img
                      src={pokemon.image}
                      alt={displayName}
                      className="w-48 h-48 mx-auto object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No image available</p>
                    </div>
                  )}
                </div>
                
                {/* Shiny Sprite */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Shiny {displayName}
                  </h3>
                  {pokemon.shinyImage ? (
                    <img
                      src={pokemon.shinyImage}
                      alt={`Shiny ${displayName}`}
                      className="w-48 h-48 mx-auto object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No shiny image available</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Shiny Odds Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Shiny Odds</CardTitle>
              <CardDescription>
                Standard shiny odds for {displayName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Generation Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Game Generation:</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                      variant={selectedGeneration === null ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedGeneration(null)}
                    >
                      Auto (Gen {pokemonGeneration})
                    </Badge>
                    {generationOptions.map((option) => (
                      <Badge
                        key={option.value}
                        variant={selectedGeneration === option.value ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedGeneration(option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                  {selectedGeneration !== null && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Showing odds for Generation {selectedGeneration <= 5 ? '1-5' : '6+'} games
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Hunt Method:</label>
                  <div className="flex flex-wrap gap-2">
                    {methods.map((method) => (
                      <Badge
                        key={method.method}
                        variant={selectedMethod === method.method ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedMethod(method.method)}
                      >
                        {method.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedMethodData && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Shiny Odds</p>
                        <p className="text-2xl font-bold">{formatOdds(selectedMethodData.odds)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Attempts</p>
                        <p className="text-2xl font-bold">{Math.ceil(1 / selectedMethodData.odds).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{selectedMethodData.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Best Methods Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Best Methods to Hunt Shiny {displayName}</CardTitle>
              <CardDescription>
                Recommended hunting methods sorted by odds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {methods
                  .sort((a, b) => a.odds - b.odds)
                  .map((method, index) => (
                    <div
                      key={method.method}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatOdds(method.odds)}</p>
                        <p className="text-xs text-muted-foreground">
                          ~{Math.ceil(1 / method.odds).toLocaleString()} attempts
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Track Your Hunt Section */}
          <Card>
            <CardHeader>
              <CardTitle>Track Your Hunt</CardTitle>
              <CardDescription>
                Start tracking your shiny {displayName} hunt with ShinyHunt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Use ShinyHunt to track your encounters, calculate probabilities, and monitor your progress
                as you hunt for shiny {displayName}.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleStartHunt}
                  size="lg"
                  className="flex-1"
                >
                  <Target className="mr-2 h-5 w-5" />
                  {isAuthenticated ? 'Start Tracking Hunt' : 'Sign Up to Start Tracking'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/tracker')}
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  View Tracker
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
