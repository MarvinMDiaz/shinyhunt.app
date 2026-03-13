import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SEO } from '@/components/SEO'
import { Search, ChevronDown, ChevronUp, Target, Trophy, BookOpen } from 'lucide-react'
import { guides, searchGuides, getGuideCategories, type Guide, type GuideCategory } from '@/data/guides'

export function GuidesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | undefined>(undefined)
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set())
  
  // Filter guides based on search and category
  const filteredGuides = useMemo(() => {
    return searchGuides(searchQuery, selectedCategory)
  }, [searchQuery, selectedCategory])
  
  const categories = getGuideCategories()
  
  const toggleGuide = (guideId: string) => {
    const newExpanded = new Set(expandedGuides)
    if (newExpanded.has(guideId)) {
      newExpanded.delete(guideId)
    } else {
      newExpanded.add(guideId)
    }
    setExpandedGuides(newExpanded)
  }
  
  return (
    <>
      <SEO
        title="Shiny Hunting Guides"
        description="Learn shiny odds, shiny hunting methods, and Pokémon shiny hunting tips with the ShinyHunt guide hub."
        canonicalUrl="https://www.shinyhunt.app/guides"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Shiny Hunting Guides
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Learn shiny odds, methods, and tips for hunting Pokémon more effectively.
            </p>
            
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search guides, methods, or shiny hunting questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === undefined ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(undefined)}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Results */}
          {filteredGuides.length > 0 ? (
            <div className="space-y-4">
              {filteredGuides.map((guide) => {
                const isExpanded = expandedGuides.has(guide.id)
                return (
                  <Card key={guide.id} className="transition-all hover:shadow-md">
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleGuide(guide.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{guide.title}</CardTitle>
                            <Badge variant="outline">{guide.category}</Badge>
                          </div>
                          <CardDescription>{guide.summary}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleGuide(guide.id)
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                          {guide.body}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg mb-2">No guides found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or category filter
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* CTA Section */}
          <Card className="mt-8 bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ready to Start Hunting?
              </CardTitle>
              <CardDescription>
                Put these guides into practice with ShinyHunt's tracking tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate('/tracker')}
                  className="flex-1"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Start a Hunt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/tracker')}
                  className="flex-1"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  View Shiny Dex
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/pokemon/pikachu-shiny-hunt')}
                  className="flex-1"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Pokémon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
