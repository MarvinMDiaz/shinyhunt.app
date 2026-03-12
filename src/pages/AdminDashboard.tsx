import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  TrendingUp, 
  Trophy, 
  Target, 
  Activity, 
  BarChart3,
  Search,
  Sparkles
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
import { formatDate } from '@/lib/utils'
import { SEO } from '@/components/SEO'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import type { BadgeId } from '@/lib/auth'

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userOverview, setUserOverview] = useState<UserOverview[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [popularPokemon, setPopularPokemon] = useState<Array<{ name: string; hunted: number; completed: number }>>([])
  const [longestHunts, setLongestHunts] = useState<LeaderboardEntry[]>([])
  const [topUsersByCompletions, setTopUsersByCompletions] = useState<UserLeaderboardEntry[]>([])
  const [topUsersByActiveHuntLength, setTopUsersByActiveHuntLength] = useState<UserLeaderboardEntry[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load admin data from Supabase
    const loadData = async () => {
      try {
        setLoading(true)
        console.log('[AdminDashboard] Loading admin data from Supabase...')
        
        const [
          statsData, 
          usersData, 
          activityData, 
          pokemonData,
          longestHuntsData,
          topCompletionsData,
          topActiveHuntData,
        ] = await Promise.all([
          getAdminStats(),
          getUserOverview(),
          getRecentActivity(50),
          getPopularPokemon(),
          getLongestHunts(10),
          getTopUsersByCompletions(10),
          getTopUsersByActiveHuntLength(10),
        ])

        console.log('[AdminDashboard] Loaded data:', {
          stats: statsData,
          usersCount: usersData.length,
          activityCount: activityData.length,
          pokemonCount: pokemonData.length,
          longestHuntsCount: longestHuntsData.length,
          topCompletionsCount: topCompletionsData.length,
          topActiveHuntCount: topActiveHuntData.length,
        })

        setStats(statsData)
        setUserOverview(usersData)
        setRecentActivity(activityData)
        setPopularPokemon(pokemonData)
        setLongestHunts(longestHuntsData)
        setTopUsersByCompletions(topCompletionsData)
        setTopUsersByActiveHuntLength(topActiveHuntData)
      } catch (error) {
        console.error('[AdminDashboard] Error loading admin data:', error)
        // Show error state - keep zeros for now
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredUsers = userOverview.filter(user =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <>
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
        title="Admin Dashboard"
        description="Admin dashboard for ShinyHunt.app"
        canonicalUrl="/admin"
        noindex={true}
        nofollow={true}
      />
      <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground mt-1">
              Platform statistics and user management
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Admin Access
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="stats">Hunt Stats</TabsTrigger>
            <TabsTrigger value="pokemon">Popular Pokémon</TabsTrigger>
            <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
            <TabsTrigger value="analytics">User Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Encounter Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Encounter Distribution</CardTitle>
                  <CardDescription>
                    How many encounters before finding shiny
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-3">
                      {Object.entries(stats.encounterDistribution).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${stats.totalShiniesFound > 0 
                                    ? (count / stats.totalShiniesFound) * 100 
                                    : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
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
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Median Encounters</span>
                    <span className="text-lg font-bold">{stats?.medianEncountersToShiny || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-lg font-bold">
                      {stats && stats.totalHunts > 0
                        ? `${Math.round((stats.completedHunts / stats.totalHunts) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Hunts per User</span>
                    <span className="text-lg font-bold">
                      {stats && stats.totalUsers > 0
                        ? Math.round(stats.totalHunts / stats.totalUsers)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Shiny Odds</span>
                    <span className="text-lg font-bold">
                      1/{stats?.averageShinyOdds || 4096}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboards Tab */}
          <TabsContent value="leaderboards" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Longest Hunts */}
              <Card>
                <CardHeader>
                  <CardTitle>Longest Hunts</CardTitle>
                  <CardDescription>Top 10 hunts by encounters</CardDescription>
                </CardHeader>
                <CardContent>
                  {longestHunts.length > 0 ? (
                    <div className="space-y-2">
                      {longestHunts.map((hunt, index) => (
                        <div
                          key={hunt.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span className="font-semibold capitalize">{hunt.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Encounters</p>
                            <p className="font-bold">{hunt.value.toLocaleString()}</p>
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
                  <CardTitle>Most Hunted Pokémon</CardTitle>
                  <CardDescription>Top 10 by hunt count</CardDescription>
                </CardHeader>
                <CardContent>
                  {popularPokemon.length > 0 ? (
                    <div className="space-y-2">
                      {popularPokemon.map((pokemon, index) => (
                        <div
                          key={pokemon.name}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span className="font-semibold capitalize">{pokemon.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Hunted</p>
                              <p className="font-bold">{pokemon.hunted}</p>
                            </div>
                            <div className="text-right w-20">
                              <p className="text-xs text-muted-foreground">Rate</p>
                              <p className="font-bold">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Users by Completions */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Completed Hunts</CardTitle>
                  <CardDescription>Top 10 users by completed hunts</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsersByCompletions.length > 0 ? (
                    <div className="space-y-2">
                      {topUsersByCompletions.map((user, index) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{user.userName}</p>
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
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="font-bold">{user.value}</p>
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
                  <CardTitle>Longest Active Hunts</CardTitle>
                  <CardDescription>Top 10 users by current hunt length</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsersByActiveHuntLength.length > 0 ? (
                    <div className="space-y-2">
                      {topUsersByActiveHuntLength.map((user, index) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{user.userName}</p>
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
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-xs text-muted-foreground">Encounters</p>
                            <p className="font-bold">{user.value.toLocaleString()}</p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Overview</CardTitle>
                    <CardDescription>
                      Manage and view all platform users
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest platform activity and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ActivityIcon type={activity.type} />
                          <div>
                            <p className="text-sm font-medium">
                              {getActivityDescription(activity)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Encounter Statistics</CardTitle>
                  <CardDescription>
                    Analysis of encounters before shiny finds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average</span>
                    <span className="text-2xl font-bold">{stats?.averageEncountersToShiny || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Median</span>
                    <span className="text-2xl font-bold">{stats?.medianEncountersToShiny || 0}</span>
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
                  <CardTitle>Hunt Completion Stats</CardTitle>
                  <CardDescription>
                    Hunt status breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Hunts</span>
                    <span className="text-lg font-bold">{stats?.activeHunts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed Hunts</span>
                    <span className="text-lg font-bold">{stats?.completedHunts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-lg font-bold">
                      {stats && stats.totalHunts > 0
                        ? `${Math.round((stats.completedHunts / stats.totalHunts) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Popular Pokémon Tab */}
          <TabsContent value="pokemon" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Hunted Pokémon</CardTitle>
                <CardDescription>
                  Top Pokémon targets across all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {popularPokemon.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hunt data available</p>
                ) : (
                  <div className="space-y-3">
                    {popularPokemon.map((pokemon, index) => (
                      <div
                        key={pokemon.name}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <span className="font-semibold capitalize">{pokemon.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Hunted</p>
                            <p className="font-bold">{pokemon.hunted}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="font-bold text-green-500">{pokemon.completed}</p>
                          </div>
                          <div className="text-right w-20">
                            <p className="text-xs text-muted-foreground">Rate</p>
                            <p className="font-bold">
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
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
