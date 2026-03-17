import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { loadPreferences, savePreferences } from '@/lib/preferencesStorage'
import { 
  Users, 
  TrendingUp, 
  Trophy, 
  Target, 
  Activity, 
  BarChart3,
  Search,
  Sparkles,
  Clock,
  Home,
  RefreshCw
} from 'lucide-react'
import { 
  getAdminStats, 
  getUserOverview, 
  getRecentActivity, 
  getPopularPokemon,
  getLongestHunts,
  getTopUsersByCompletions,
  getTopUsersByActiveHuntLength,
  AdminStats, 
  UserOverview, 
  RecentActivity,
  LeaderboardEntry,
  UserLeaderboardEntry,
} from '@/lib/adminData'
import { getLiveAnalytics, type LiveAnalytics } from '@/lib/supabase/analytics'
import { formatDate } from '@/lib/utils'
import { SEO } from '@/components/SEO'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import type { BadgeId } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(() => loadPreferences().darkMode)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userOverview, setUserOverview] = useState<UserOverview[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [popularPokemon, setPopularPokemon] = useState<Array<{ name: string; hunted: number; completed: number }>>([])
  const [longestHunts, setLongestHunts] = useState<LeaderboardEntry[]>([])
  const [topUsersByCompletions, setTopUsersByCompletions] = useState<UserLeaderboardEntry[]>([])
  const [topUsersByActiveHuntLength, setTopUsersByActiveHuntLength] = useState<UserLeaderboardEntry[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState('live')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isRefreshingRef = useRef(false)

  const loadDataForTab = async (tab: string) => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      switch (tab) {
        case 'live': {
          const data = await getLiveAnalytics()
          setLiveAnalytics(data)
          break
        }
        case 'overview':
        case 'stats': {
          const data = await getAdminStats()
          setStats(data)
          break
        }
        case 'users': {
          const data = await getUserOverview()
          setUserOverview(data)
          break
        }
        case 'activity': {
          const data = await getRecentActivity(50)
          setRecentActivity(data)
          break
        }
        case 'pokemon': {
          const data = await getPopularPokemon()
          setPopularPokemon(data)
          break
        }
        case 'leaderboards': {
          const [pokemonData, longestData] = await Promise.all([
            getPopularPokemon(),
            getLongestHunts(10),
          ])
          setPopularPokemon(pokemonData)
          setLongestHunts(longestData)
          break
        }
        case 'analytics': {
          const [completionsData, activeData] = await Promise.all([
            getTopUsersByCompletions(10),
            getTopUsersByActiveHuntLength(10),
          ])
          setTopUsersByCompletions(completionsData)
          setTopUsersByActiveHuntLength(activeData)
          break
        }
        default:
          break
      }
    } catch (error) {
      logger.error('Error loading admin data')
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    if (document.visibilityState !== 'visible') return
    loadDataForTab(activeTab)
  }

  useEffect(() => {
    const loadDataAll = async () => {
      if (isRefreshingRef.current) return
      isRefreshingRef.current = true
      try {
        setLoading(true)
        const [
          statsData,
          usersData,
          activityData,
          pokemonData,
          longestHuntsData,
          topCompletionsData,
          topActiveHuntData,
          liveAnalyticsData,
        ] = await Promise.all([
          getAdminStats(),
          getUserOverview(),
          getRecentActivity(50),
          getPopularPokemon(),
          getLongestHunts(10),
          getTopUsersByCompletions(10),
          getTopUsersByActiveHuntLength(10),
          getLiveAnalytics(),
        ])

        setStats(statsData)
        setUserOverview(usersData)
        setRecentActivity(activityData)
        setPopularPokemon(pokemonData)
        setLongestHunts(longestHuntsData)
        setTopUsersByCompletions(topCompletionsData)
        setTopUsersByActiveHuntLength(topActiveHuntData)
        setLiveAnalytics(liveAnalyticsData)
      } catch (error) {
        logger.error('Error loading admin data')
      } finally {
        setLoading(false)
        isRefreshingRef.current = false
      }
    }

    loadDataAll()
  }, [])

  useEffect(() => {
    const POLL_INTERVAL_MS = 60000
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      loadDataForTab(activeTab)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [activeTab])

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Save dark mode preference when changed
  useEffect(() => {
    savePreferences({ darkMode })
  }, [darkMode])

  const filteredUsers = userOverview.filter(user =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <>
        <SEO
          title="Admin Dashboard"
          description="ShinyHunt admin dashboard for managing users, hunts, and platform statistics."
          canonicalUrl="https://www.shinyhunt.app/admin"
          noindex={true}
          nofollow={true}
        />
        <SEO
          title="Admin Dashboard"
          description="Admin dashboard for ShinyHunt.app"
          canonicalUrl="/admin"
          noindex={true}
          nofollow={true}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO
        title="Admin Dashboard — ShinyHunt"
        description="ShinyHunt admin dashboard for managing users, hunts, and platform statistics."
        canonicalUrl="https://www.shinyhunt.app/admin"
        noindex={true}
        nofollow={true}
      />
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Platform statistics and user management
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-9 px-3"
              title="Refresh current tab"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="h-9 px-3"
              title="Back to Home"
            >
              <Home className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <DarkModeToggle
              darkMode={darkMode}
              onToggle={() => setDarkMode((prev) => !prev)}
            />
            <Badge variant="outline" className="text-xs sm:text-sm">
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="h-5 w-5" />}
            description="Registered users"
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={<Activity className="h-5 w-5" />}
            description="Active in last 30 days"
          />
          <StatCard
            title="New Users (7d)"
            value={stats?.newUsersLast7Days || 0}
            icon={<TrendingUp className="h-5 w-5" />}
            description="Joined this week"
          />
          <StatCard
            title="Total Hunts"
            value={stats?.totalHunts || 0}
            icon={<Target className="h-5 w-5" />}
            description="All time hunts"
          />
          <StatCard
            title="Active Hunts"
            value={stats?.activeHunts || 0}
            icon={<Target className="h-5 w-5" />}
            description="Currently tracking"
          />
          <StatCard
            title="Completed Hunts"
            value={stats?.completedHunts || 0}
            icon={<Trophy className="h-5 w-5" />}
            description="Shinies found"
          />
          <StatCard
            title="Total Shinies"
            value={stats?.totalShiniesFound || 0}
            icon={<Sparkles className="h-5 w-5" />}
            description="Shinies obtained"
          />
          <StatCard
            title="Avg Encounters"
            value={stats?.averageEncountersToShiny || 0}
            icon={<BarChart3 className="h-5 w-5" />}
            description="To find shiny"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="w-full sm:w-auto min-w-max">
              <TabsTrigger value="live" className="text-xs sm:text-sm">Live Stats</TabsTrigger>
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs sm:text-sm">Stats</TabsTrigger>
              <TabsTrigger value="pokemon" className="text-xs sm:text-sm">Pokémon</TabsTrigger>
              <TabsTrigger value="leaderboards" className="text-xs sm:text-sm">Leaderboards</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Encounter Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Encounter Distribution</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    How many encounters before finding shiny
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-3">
                      {Object.entries(stats.encounterDistribution).map(([range, count]) => (
                        <div key={range} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">{range}</span>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex-1 sm:w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${stats.totalShiniesFound > 0 
                                    ? (count / stats.totalShiniesFound) * 100 
                                    : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm font-medium w-12 sm:w-auto text-right shrink-0">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Quick Stats</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Median Encounters</span>
                    <span className="text-base sm:text-lg font-bold">{stats?.medianEncountersToShiny || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-base sm:text-lg font-bold">
                      {stats && stats.totalHunts > 0
                        ? `${Math.round((stats.completedHunts / stats.totalHunts) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Avg Hunts per User</span>
                    <span className="text-base sm:text-lg font-bold">
                      {stats && stats.totalUsers > 0
                        ? Math.round(stats.totalHunts / stats.totalUsers)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Avg Shiny Odds</span>
                    <span className="text-base sm:text-lg font-bold">
                      1/{stats?.averageShinyOdds || 4096}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboards Tab */}
          <TabsContent value="leaderboards" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Longest Hunts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Longest Hunts</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Top 10 hunts by encounters</CardDescription>
                </CardHeader>
                <CardContent>
                  {longestHunts.length > 0 ? (
                    <div className="space-y-2">
                      {longestHunts.map((hunt, index) => (
                        <div
                          key={hunt.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                              #{index + 1}
                            </span>
                            <span className="font-semibold capitalize text-sm sm:text-base truncate">{hunt.name}</span>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Encounters</p>
                            <p className="font-bold text-sm sm:text-base">{hunt.value.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hunt data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Most Hunted Pokémon (already exists, but show here too) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Most Hunted Pokémon</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Top 10 by hunt count</CardDescription>
                </CardHeader>
                <CardContent>
                  {popularPokemon.length > 0 ? (
                    <div className="space-y-2">
                      {popularPokemon.map((pokemon, index) => (
                        <div
                          key={pokemon.name}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                              #{index + 1}
                            </span>
                            <span className="font-semibold capitalize text-sm sm:text-base truncate">{pokemon.name}</span>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-foreground">Hunted</p>
                              <p className="font-bold text-sm sm:text-base">{pokemon.hunted}</p>
                            </div>
                            <div className="text-left sm:text-right sm:w-20">
                              <p className="text-xs text-muted-foreground">Rate</p>
                              <p className="font-bold text-sm sm:text-base">
                                {pokemon.hunted > 0
                                  ? `${Math.round((pokemon.completed / pokemon.hunted) * 100)}%`
                                  : '0%'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No Pokémon data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Top Users by Completions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Most Completed Hunts</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Top 10 users by completed hunts</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsersByCompletions.length > 0 ? (
                    <div className="space-y-2">
                      {topUsersByCompletions.map((user, index) => (
                        <div
                          key={user.userId}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0 pt-0.5">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-sm sm:text-base">{user.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.userEmail}</p>
                              {user.metadata?.badges && Array.isArray(user.metadata.badges) && user.metadata.badges.length > 0 && (
                                <div className="mt-1">
                                  <BadgeDisplay 
                                    badgeIds={(user.metadata.badges as BadgeId[]).filter((b): b is BadgeId => 
                                      ['first_151_trainer', 'hundred_shiny_hunts', 'full_dex_completion', 'gen_1_master', 'ten_thousand_attempts', 'pokeverse_member'].includes(b)
                                    )} 
                                    showTooltip={true}
                                    className="flex-wrap"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0 sm:ml-2 w-full sm:w-auto">
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="font-bold text-sm sm:text-base">{user.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No user data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top Users by Active Hunt Length */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Longest Active Hunts</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Top 10 users by current hunt length</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsersByActiveHuntLength.length > 0 ? (
                    <div className="space-y-2">
                      {topUsersByActiveHuntLength.map((user, index) => (
                        <div
                          key={user.userId}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0 pt-0.5">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-sm sm:text-base">{user.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.metadata?.pokemon || 'Unknown Pokémon'}
                              </p>
                              {user.metadata?.badges && Array.isArray(user.metadata.badges) && user.metadata.badges.length > 0 && (
                                <div className="mt-1">
                                  <BadgeDisplay 
                                    badgeIds={(user.metadata.badges as BadgeId[]).filter((b): b is BadgeId => 
                                      ['first_151_trainer', 'hundred_shiny_hunts', 'full_dex_completion', 'gen_1_master', 'ten_thousand_attempts', 'pokeverse_member'].includes(b)
                                    )} 
                                    showTooltip={true}
                                    className="flex-wrap"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0 sm:ml-2 w-full sm:w-auto">
                            <p className="text-xs text-muted-foreground">Encounters</p>
                            <p className="font-bold text-sm sm:text-base">{user.value.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active hunt data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">User Overview</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Manage and view all platform users
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Card Layout */}
                <div className="block sm:hidden space-y-3 p-4">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No users found</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="border rounded-lg p-3 space-y-2 bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs shrink-0 ml-2">
                            {user.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Join Date:</span>
                            <p className="font-medium">{formatDate(user.joinDate)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hunts:</span>
                            <p className="font-medium">{user.totalHunts}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Shinies:</span>
                            <p className="font-medium">{user.totalShinies}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Join Date</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Total Hunts</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Shinies</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-muted-foreground">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{user.name}</td>
                            <td className="p-2 text-sm text-muted-foreground">{user.email}</td>
                            <td className="p-2 text-sm">{formatDate(user.joinDate)}</td>
                            <td className="p-2 text-sm">{user.totalHunts}</td>
                            <td className="p-2 text-sm">{user.totalShinies}</td>
                            <td className="p-2">
                              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                {user.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Latest platform activity and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <ActivityIcon type={activity.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium break-words">
                              {getActivityDescription(activity)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 sm:ml-2">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hunt Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Encounter Statistics</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Analysis of encounters before shiny finds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Average</span>
                    <span className="text-xl sm:text-2xl font-bold">{stats?.averageEncountersToShiny || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Median</span>
                    <span className="text-xl sm:text-2xl font-bold">{stats?.medianEncountersToShiny || 0}</span>
                  </div>
                  {/* TODO: Add lowest/highest when data is available */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground italic">
                      Lowest/Highest encounter stats coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Hunt Completion Stats</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Hunt status breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Active Hunts</span>
                    <span className="text-base sm:text-lg font-bold">{stats?.activeHunts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Completed Hunts</span>
                    <span className="text-base sm:text-lg font-bold">{stats?.completedHunts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-base sm:text-lg font-bold">
                      {stats && stats.totalHunts > 0
                        ? `${Math.round((stats.completedHunts / stats.totalHunts) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Analytics Tab */}
          <TabsContent value="live" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Active Users Right Now */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    Active Right Now
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Users online in last 2 minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-3xl sm:text-4xl font-bold">{liveAnalytics?.activeUsersNow || 0}</div>
                  {liveAnalytics && liveAnalytics.recentlyActiveUsers.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Recently active:</p>
                      {liveAnalytics.recentlyActiveUsers.slice(0, 3).map((user) => (
                        <p key={user.id} className="text-xs truncate">{user.name}</p>
                      ))}
                      {liveAnalytics.recentlyActiveUsers.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{liveAnalytics.recentlyActiveUsers.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Signups Today */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    New Signups Today
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Users joined today
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-3xl sm:text-4xl font-bold">{liveAnalytics?.newSignupsToday || 0}</div>
                </CardContent>
              </Card>

              {/* Hunts Started Today */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    Hunts Started Today
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    New hunts created today
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-3xl sm:text-4xl font-bold">{liveAnalytics?.huntsStartedToday || 0}</div>
                </CardContent>
              </Card>

              {/* Longest Running Hunts */}
              {liveAnalytics?.longestRunningHunts && liveAnalytics.longestRunningHunts.length > 0 && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      Longest Running Hunts
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Top 5 longest active hunts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="space-y-3">
                      {liveAnalytics.longestRunningHunts.map((hunt, index) => (
                        <div
                          key={hunt.huntId}
                          className="py-2 border-b last:border-b-0 last:pb-0 first:pt-0"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">
                              #{index + 1}
                            </span>
                            <p className="font-semibold text-sm sm:text-base capitalize">
                              {hunt.pokemonName}
                            </p>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground pl-7">
                            {hunt.userName}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t mt-2 pl-7">
                            <span className="text-xs text-muted-foreground">Time:</span>
                            <span className="text-sm font-bold">{hunt.elapsedTime}</span>
                          </div>
                          <div className="flex items-center justify-between pl-7">
                            <span className="text-xs text-muted-foreground">Encounters:</span>
                            <span className="text-sm font-bold">{hunt.encounters.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Most Active Hunters Today */}
              {(liveAnalytics?.mostActiveHuntersToday?.length > 0 || liveAnalytics?.currentUserStats) && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      Most Active Today
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Top 5 resetters today
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="space-y-3">
                      {liveAnalytics?.currentUserStats && (
                        <div className="flex items-center justify-between py-2 pb-3 border-b border-primary/30 bg-primary/5 -mx-1 px-2 rounded">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-primary w-5 shrink-0">
                              {liveAnalytics.currentUserStats.rank ? `#${liveAnalytics.currentUserStats.rank}` : '—'}
                            </span>
                            <p className="font-semibold text-sm sm:text-base text-primary">
                              You
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">Resets:</span>
                            <span className="text-sm font-bold text-primary">{liveAnalytics.currentUserStats.resetsToday.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      {liveAnalytics?.mostActiveHuntersToday?.map((hunter, index) => (
                        <div
                          key={hunter.userId}
                          className="flex items-center justify-between py-2 border-b last:border-b-0 last:pb-0 first:pt-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">
                              #{index + 1}
                            </span>
                            <p className="font-semibold text-sm sm:text-base truncate">
                              {hunter.userName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">Resets:</span>
                            <span className="text-sm font-bold">{hunter.resetsToday.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Popular Pokémon Tab */}
          <TabsContent value="pokemon" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Most Hunted Pokémon</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Top Pokémon targets across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {popularPokemon.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No hunt data available</p>
                ) : (
                  <div className="space-y-3">
                    {popularPokemon.map((pokemon, index) => (
                      <div
                        key={pokemon.name}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                            #{index + 1}
                          </span>
                          <span className="font-semibold capitalize text-sm sm:text-base">{pokemon.name}</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-muted-foreground">Hunted</p>
                            <p className="font-bold text-sm sm:text-base">{pokemon.hunted}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="font-bold text-green-500 text-sm sm:text-base">{pokemon.completed}</p>
                          </div>
                          <div className="text-left sm:text-right sm:w-20">
                            <p className="text-xs text-muted-foreground">Rate</p>
                            <p className="font-bold text-sm sm:text-base">
                              {pokemon.hunted > 0
                                ? `${Math.round((pokemon.completed / pokemon.hunted) * 100)}%`
                                : '0%'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  )
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: number
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="text-xl sm:text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
  switch (type) {
    case 'user_signup':
      return <Users className="h-4 w-4 text-blue-500" />
    case 'hunt_created':
      return <Target className="h-4 w-4 text-green-500" />
    case 'hunt_completed':
      return <Trophy className="h-4 w-4 text-yellow-500" />
    case 'shiny_found':
      return <Sparkles className="h-4 w-4 text-yellow-400" />
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />
  }
}

function getActivityDescription(activity: RecentActivity): string {
  switch (activity.type) {
    case 'user_signup':
      return `${activity.userName} joined ShinyHunt`
    case 'hunt_created':
      return `${activity.userName} started hunting ${activity.pokemonName || 'a Pokémon'}`
    case 'hunt_completed':
      return `${activity.userName} completed hunt for ${activity.pokemonName || 'a Pokémon'}`
    case 'shiny_found':
      return `${activity.userName} found shiny ${activity.pokemonName || 'Pokémon'}${activity.data?.encounters ? ` (${activity.data.encounters} encounters)` : ''}`
    default:
      return 'Unknown activity'
  }
}
