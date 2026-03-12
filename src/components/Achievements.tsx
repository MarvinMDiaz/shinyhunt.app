import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser, getUserBadges, BadgeId } from '@/lib/auth'
import { useUserProfile } from '@/context/UserProfileContext'
import { formatDate } from '@/lib/utils'
import { Sparkles, Award, Star } from 'lucide-react'

const isDev = import.meta.env.DEV

interface AchievementCardProps {
  badgeId: BadgeId
  unlockedDate: Date
  signupNumber?: number
}

function AchievementCard({ badgeId, unlockedDate, signupNumber }: AchievementCardProps) {
  const badge = getUserBadges([badgeId])[0]
  if (!badge) return null

  // Use custom image for PokéVerse badge, default for others
  // Badge orb: /badges/dmvpokeverse.png for PokéVerse badge
  const badgeImagePath = badgeId === 'pokeverse_member' 
    ? '/badges/dmvpokeverse.png'
    : '/badges/badge.png'
  const [imageError, setImageError] = useState(false)

  // Determine rarity/status label based on badge type
  const getRarityLabel = (id: BadgeId): { text: string; variant: 'default' | 'secondary' | 'outline' } => {
    switch (id) {
      case 'first_151_trainer':
        return { text: 'Founder Badge', variant: 'default' }
      case 'full_dex_completion':
        return { text: 'Legendary Achievement', variant: 'default' }
      case 'pokeverse_member':
        return { text: 'Community Badge', variant: 'default' }
      case 'hundred_shiny_hunts':
      case 'ten_thousand_attempts':
        return { text: 'Milestone Badge', variant: 'secondary' }
      default:
        return { text: 'Achievement', variant: 'outline' }
    }
  }

  const rarityLabel = getRarityLabel(badgeId)
  const isFounderBadge = badgeId === 'first_151_trainer'
  const isPokeverseBadge = badgeId === 'pokeverse_member'
  
  // Podium image path - use PokéVerse podium for PokéVerse badge
  // Podium: /badges/podium-pokeverse.png for PokéVerse badge
  const podiumImagePath = isPokeverseBadge ? '/badges/podium-pokeverse.png' : '/badges/podium.png'
  
  // Debug logging (dev only)
  if (isDev) {
    if (isPokeverseBadge) {
      console.log('[Achievements] PokéVerse badge detected - using podium-pokeverse.png:', {
        badgeId,
        isPokeverseBadge,
        podiumImagePath,
      })
    }
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card/98 to-card/95 border-2 border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-500 group">
      {/* Premium inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-cyan-500/5 opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
      
      
      <CardHeader className="pb-3 pt-3">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Badge Showcase Area - Static Stage with Floating Badge */}
          <div className="relative w-full overflow-hidden" style={{ height: '320px' }}>
            {/* Static Showcase Background - Podium/Stage Image (No Animation) */}
            <div className="absolute inset-0 flex items-end justify-center pb-0 z-10">
              <img
                key={`podium-${badgeId}-${podiumImagePath}`}
                src={podiumImagePath}
                alt={isPokeverseBadge ? "PokéVerse Podium" : "Trophy Podium"}
                className="w-full max-w-[300px] md:max-w-[360px] h-auto object-contain drop-shadow-lg"
                style={{ 
                  zIndex: 10,
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1,
                }}
                onError={(e) => {
                  console.error('[Achievements] Failed to load podium image:', {
                    expectedPath: podiumImagePath,
                    actualSrc: e.currentTarget.src,
                    badgeId,
                    isPokeverseBadge,
                  })
                }}
              />
              {/* Future: Founder number overlay will be positioned here on the podium nameplate */}
            </div>
            
            {/* Floating Badge Layer - Only Animated Element */}
            <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ bottom: '80px' }}>
              {!imageError ? (
                <div className="relative">
                  <img
                    src={badgeImagePath}
                    alt={badge.name}
                    className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl filter relative z-10"
                    style={{
                      animation: 'badge-float 3s ease-in-out infinite',
                    }}
                    onError={() => setImageError(true)}
                  />
                  {/* Shadow under badge */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-24 h-8 bg-black/20 blur-xl rounded-full -mt-4 z-0" />
                  
                  {/* Pokémon-style sparkles around badge - only for founder badge */}
                  {isFounderBadge && (
                    <>
                      <div 
                        className="absolute -top-2 -left-2 w-5 h-5 pointer-events-none z-20"
                        style={{
                          animation: 'pokemon-shiny-sparkle-burst 3s ease-out infinite',
                          animationDelay: '0s',
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-full blur-[4px] drop-shadow-xl" />
                        <div className="absolute inset-0 bg-white/80 rounded-full blur-[2px]" />
                      </div>
                      
                      <div 
                        className="absolute -top-2 -right-2 w-5 h-5 pointer-events-none z-20"
                        style={{
                          animation: 'pokemon-shiny-sparkle-burst 3s ease-out infinite',
                          animationDelay: '0.1s',
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-full blur-[4px] drop-shadow-xl" />
                        <div className="absolute inset-0 bg-white/80 rounded-full blur-[2px]" />
                      </div>
                      
                      <div 
                        className="absolute -bottom-2 -right-2 w-5 h-5 pointer-events-none z-20"
                        style={{
                          animation: 'pokemon-shiny-sparkle-burst 3s ease-out infinite',
                          animationDelay: '0.2s',
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-full blur-[4px] drop-shadow-xl" />
                        <div className="absolute inset-0 bg-white/80 rounded-full blur-[2px]" />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 border-2 border-yellow-500/50 rounded-xl flex items-center justify-center drop-shadow-2xl relative z-10"
                    style={{
                      animation: 'badge-float 3s ease-in-out infinite',
                    }}
                  >
                    <span className="text-5xl">{badge.icon || '✨'}</span>
                  </div>
                  {/* Shadow under badge */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-24 h-8 bg-black/20 blur-xl rounded-full -mt-4 z-0" />
                </div>
              )}
            </div>
          </div>
          
          {/* Rarity/Status Label */}
          <div className="flex justify-center">
            <Badge 
              variant={rarityLabel.variant}
              className={`text-xs font-semibold px-3 py-1 ${
                isFounderBadge 
                  ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-500/20 dark:to-yellow-600/20 border-yellow-400 dark:border-yellow-500/40 text-yellow-900 dark:text-yellow-200' 
                  : ''
              }`}
            >
              {isFounderBadge && <Star className="w-3 h-3 mr-1 inline" />}
              {rarityLabel.text}
            </Badge>
          </div>
          
          {/* Achievement Title - Below Badge */}
          <div className="space-y-2 w-full pt-2">
            <CardTitle className="text-lg md:text-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {badge.icon && <span className="text-xl">{badge.icon}</span>}
              {badge.name}
            </CardTitle>
            
            {/* Description - Below Title */}
            <CardDescription className="text-xs md:text-sm text-center text-muted-foreground/90 leading-relaxed max-w-sm mx-auto">
              {badge.description}
              {isFounderBadge && signupNumber && signupNumber <= 151 && (
                <>
                  <br />
                  <span className={`font-semibold ${
                    signupNumber <= 10 
                      ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' 
                      : 'text-yellow-500/90'
                  }`}>
                    {signupNumber <= 10 && '🔥 '}
                    Trainer #{signupNumber} of 151
                  </span>
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {/* Unlocked Footer - Subtle */}
      <div className="px-6 pb-4 pt-0 border-t border-border/30">
        <p className="text-xs text-muted-foreground/70 font-medium text-center flex items-center justify-center gap-1.5">
          <Award className="w-3 h-3" />
          <span>Unlocked • {formatDate(unlockedDate)}</span>
        </p>
      </div>
    </Card>
  )
}

export function Achievements() {
  const { profile, loadingProfile } = useUserProfile()
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>> | null>(null)
  
  // Load user data (for createdAt and signupNumber)
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [profile])
  
  // Get badges from profile (Supabase) - this is the source of truth
  // Ensure badges is always an array
  const userBadges = Array.isArray(profile?.badges) ? profile.badges : (profile?.badges ? [profile.badges] : [])
  const signupNumber = profile?.signup_number
  
  // Explicitly check for boolean true (handle string "true" or boolean true)
  // Also handle case where founder_badge might be stored as number 1 or string "1"
  const founderBadgeRaw = profile?.founder_badge
  const founderBadge = founderBadgeRaw === true || 
                       (typeof founderBadgeRaw === 'string' && founderBadgeRaw === 'true') || 
                       (typeof founderBadgeRaw === 'number' && founderBadgeRaw === 1) || 
                       (typeof founderBadgeRaw === 'string' && founderBadgeRaw === '1')
  
  // Check for PokéVerse badge (from pokeverse_member field)
  const pokeverseBadgeRaw = profile?.pokeverse_member
  const pokeverseBadge = pokeverseBadgeRaw === true || 
                         (typeof pokeverseBadgeRaw === 'string' && pokeverseBadgeRaw === 'true') || 
                         (typeof pokeverseBadgeRaw === 'number' && pokeverseBadgeRaw === 1) || 
                         (typeof pokeverseBadgeRaw === 'string' && pokeverseBadgeRaw === '1')
  
  // DEBUG: Log raw profile values (dev only)
  useEffect(() => {
    if (profile && isDev) {
      console.log('[Achievements] 📊 RAW profile data from context:', {
        profileId: profile.id,
        signup_number: profile.signup_number,
        founder_badge: profile.founder_badge,
        founder_badge_type: typeof profile.founder_badge,
        founder_badge_value: founderBadgeRaw,
        pokeverse_member: profile.pokeverse_member,
        pokeverse_member_type: typeof profile.pokeverse_member,
        pokeverse_member_value: pokeverseBadgeRaw,
        pokeverseBadge: pokeverseBadge,
        founder_popup_shown: profile.founder_popup_shown,
        badges: profile.badges,
        badges_type: typeof profile.badges,
        badges_is_array: Array.isArray(profile.badges),
      })
    }
  }, [profile, founderBadgeRaw, pokeverseBadgeRaw, pokeverseBadge])
  
  // CRITICAL: If user has founder_badge = true, ALWAYS ensure first_151_trainer is in badges array for display
  // This is the source of truth - founder_badge from Supabase determines if badge should show
  const shouldInjectFounderBadge = founderBadge && !userBadges.includes('first_151_trainer')
  let displayBadges = shouldInjectFounderBadge
    ? [...userBadges, 'first_151_trainer']
    : userBadges
  
  // CRITICAL: If user has pokeverse_member = true, ALWAYS ensure pokeverse_member is in badges array for display
  const shouldInjectPokeverseBadge = pokeverseBadge && !displayBadges.includes('pokeverse_member')
  displayBadges = shouldInjectPokeverseBadge
    ? [...displayBadges, 'pokeverse_member']
    : displayBadges
  
  // Force inject if founderBadge is true but somehow not in displayBadges (defensive check)
  let finalDisplayBadges = founderBadge && !displayBadges.includes('first_151_trainer')
    ? [...displayBadges, 'first_151_trainer']
    : displayBadges
  
  // Force inject if pokeverseBadge is true but somehow not in finalDisplayBadges (defensive check)
  finalDisplayBadges = pokeverseBadge && !finalDisplayBadges.includes('pokeverse_member')
    ? [...finalDisplayBadges, 'pokeverse_member']
    : finalDisplayBadges
  
  // Debug logging - detailed breakdown (dev only)
  useEffect(() => {
    if (profile && isDev) {
      console.log('[Achievements] 🔍 BADGE INJECTION LOGIC:', {
        step1_rawProfile: {
          signup_number: profile.signup_number,
          founder_badge: profile.founder_badge,
          founder_badge_type: typeof profile.founder_badge,
          founder_badge_raw_value: founderBadgeRaw,
          badges_from_db: profile.badges,
        },
        step2_processed: {
          signupNumber,
          founderBadge,
          founderBadgeEvaluated: founderBadge,
          userBadges,
          userBadgesLength: userBadges.length,
          hasFirst151InBadges: userBadges.includes('first_151_trainer'),
        },
        step3_injection: {
          shouldInjectFounderBadge,
          reason: shouldInjectFounderBadge 
            ? 'founder_badge=true AND first_151_trainer not in badges array'
            : founderBadge 
              ? 'first_151_trainer already in badges array'
              : `founder_badge is not true (value: ${founderBadgeRaw}, type: ${typeof founderBadgeRaw})`,
        },
        step4_result: {
          displayBadges,
          displayBadgesLength: displayBadges.length,
          willShowFounderBadge: displayBadges.includes('first_151_trainer'),
        },
        step5_final: {
          finalDisplayBadges,
          finalDisplayBadgesLength: finalDisplayBadges.length,
          finalWillShowFounderBadge: finalDisplayBadges.includes('first_151_trainer'),
          finalWillShowPokeverseBadge: finalDisplayBadges.includes('pokeverse_member'),
        },
        pokeverse_badge_logic: {
          pokeverseBadgeRaw,
          pokeverseBadge,
          shouldInjectPokeverseBadge,
          pokeverseInDisplayBadges: displayBadges.includes('pokeverse_member'),
          pokeverseInFinalDisplayBadges: finalDisplayBadges.includes('pokeverse_member'),
        },
      })
    }
  }, [profile, signupNumber, founderBadge, founderBadgeRaw, userBadges, shouldInjectFounderBadge, displayBadges, finalDisplayBadges, pokeverseBadgeRaw, pokeverseBadge, shouldInjectPokeverseBadge])
  
  // Show loading state only on initial load (not during refreshes)
  // Check if we have any profile data at all
  if (loadingProfile && !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] py-12">
        <div className="relative">
          <Sparkles className="h-16 w-16 text-muted-foreground/30 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Loading achievements...</h3>
        </div>
      </div>
    )
  }
  
  // CRITICAL FIX: Check finalDisplayBadges.length instead of userBadges.length
  // This ensures founder badge appears even if badges array is empty but founder_badge=true
  if (finalDisplayBadges.length === 0) {
    if (isDev) {
      console.log('[Achievements] ⚠️ No achievements to display (finalDisplayBadges is empty)', {
        userBadges,
        userBadgesLength: userBadges.length,
        founderBadge,
        founderBadgeRaw,
        displayBadges,
        displayBadgesLength: displayBadges.length,
        finalDisplayBadges,
        finalDisplayBadgesLength: finalDisplayBadges.length,
      })
    }
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] py-12">
        <div className="relative">
          <Sparkles className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">No Achievements Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Complete hunts and reach milestones to unlock special trainer achievements!
          </p>
        </div>
      </div>
    )
  }

  // Sort badges by unlock date (signup date for first_151_trainer)
  // Use profile creation date or current date as fallback
  const validBadgeIds: BadgeId[] = ['first_151_trainer', 'hundred_shiny_hunts', 'full_dex_completion', 'gen_1_master', 'ten_thousand_attempts', 'pokeverse_member']
  const achievements = finalDisplayBadges
    .filter((badgeId): badgeId is BadgeId => {
      // Type guard to ensure badgeId is a valid BadgeId
      const isValid = validBadgeIds.includes(badgeId as BadgeId)
      if (!isValid && isDev) {
        console.log(`[Achievements] ⚠️ Skipping invalid badge ID: ${badgeId}`)
      }
      return isValid
    })
    .map(badgeId => {
      const achievement = {
        badgeId,
        unlockedDate: badgeId === 'first_151_trainer' 
          ? (user?.createdAt ? new Date(user.createdAt) : new Date())
          : new Date(), // For now, use current date for other badges
        signupNumber: badgeId === 'first_151_trainer' ? (signupNumber ?? undefined) : undefined,
      }
      if (isDev) {
        console.log(`[Achievements] ✅ Adding achievement to render list:`, {
          badgeId: achievement.badgeId,
          signupNumber: achievement.signupNumber,
          unlockedDate: achievement.unlockedDate,
        })
      }
      return achievement
    })

  // DEBUG: Final achievement list (dev only)
  if (isDev) {
    console.log('[Achievements] 🎯 Final achievements array to render:', {
      count: achievements.length,
      achievements: achievements.map(a => ({
        badgeId: a.badgeId,
        signupNumber: a.signupNumber,
      })),
      includesFounder: achievements.some(a => a.badgeId === 'first_151_trainer'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trainer Achievements</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Account-level badges and milestones
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {finalDisplayBadges.length} {finalDisplayBadges.length === 1 ? 'achievement' : 'achievements'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map(({ badgeId, unlockedDate, signupNumber }) => (
          <AchievementCard
            key={badgeId}
            badgeId={badgeId}
            unlockedDate={unlockedDate}
            signupNumber={signupNumber}
          />
        ))}
      </div>
    </div>
  )
}
