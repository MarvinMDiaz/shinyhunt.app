import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getUserBadges } from '@/lib/auth'
import { BadgeId } from '@/lib/auth'

interface BadgeDisplayProps {
  badgeIds: BadgeId[]
  showTooltip?: boolean
  className?: string
}

export function BadgeDisplay({ badgeIds, showTooltip = true, className = '' }: BadgeDisplayProps) {
  const badges = getUserBadges(badgeIds)

  if (badges.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map((badge) => {
        const badgeContent = (
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-semibold px-3 py-1 cursor-help"
          >
            {badge.icon && <span className="mr-1.5">{badge.icon}</span>}
            {badge.name}
          </Badge>
        )

        if (showTooltip) {
          return (
            <Popover key={badge.id}>
              <PopoverTrigger asChild>
                {badgeContent}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 text-sm" side="top">
                <p className="font-medium">{badge.name}</p>
                <p className="text-muted-foreground text-xs mt-1">{badge.description}</p>
              </PopoverContent>
            </Popover>
          )
        }

        return <div key={badge.id}>{badgeContent}</div>
      })}
    </div>
  )
}
