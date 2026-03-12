import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Trophy } from 'lucide-react'
import { markFirst151PopupSeen } from '@/lib/auth'
import { markFirst151PopupSeen as markPopupSeenSupabase } from '@/lib/supabase/auth'
import { useUserProfile } from '@/context/UserProfileContext'
import { useNavigate } from 'react-router-dom'
import { logger } from '@/lib/logger'

interface First151CelebrationPopupProps {
  open: boolean
  onClose: () => void
}

export function First151CelebrationPopup({ open, onClose }: First151CelebrationPopupProps) {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useUserProfile()
  const [showSparkles, setShowSparkles] = useState(true)

  useEffect(() => {
    if (open) {
      // Mark popup as seen in Supabase (persisted data)
      const markAsSeen = async () => {
        // Update Supabase profile
        if (profile?.id) {
          const result = await markPopupSeenSupabase(profile.id)
          
          if (result.error) {
            logger.error('Error marking popup as seen')
          }
          
          // Refresh profile to update local state
          await refreshProfile()
        }
        
        // Also update localStorage for backward compatibility (legacy)
        markFirst151PopupSeen()
      }
      
      markAsSeen()
      
      // Animate sparkles
      const interval = setInterval(() => {
        setShowSparkles(prev => !prev)
      }, 500)
      
      return () => clearInterval(interval)
    }
  }, [open, profile?.id, refreshProfile])

  const handleViewTrophyCase = () => {
    onClose()
    // Navigate to Shiny Collection tab with achievements selected
    navigate('/tracker')
    // Trigger event to switch to accomplished tab, then achievements sub-tab
    setTimeout(() => {
      const event = new CustomEvent('switchToAchievements')
      window.dispatchEvent(event)
    }, 100)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border-2 border-yellow-500/30">
        {/* Shiny sparkle background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {showSparkles && (
            <>
              <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" />
              <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.2s' }} />
              <div className="absolute bottom-20 left-20 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.4s' }} />
              <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.6s' }} />
            </>
          )}
        </div>

        <div className="relative p-8 space-y-6">
          {/* Header with sparkle icon */}
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
              First 151 Trainer Unlocked!
            </h2>
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>

          {/* Badge Image */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Glow effect around badge */}
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
              
              {/* Badge image */}
              <img
                src="/badges/first-151-trainer.png"
                alt="First 151 Trainer Badge"
                className="relative w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl animate-bounce"
                style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}
                onError={(e) => {
                  // Fallback if image doesn't exist
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-foreground">
              You're one of the first 151 trainers to join ShinyHunt!
            </p>
            <p className="text-sm text-muted-foreground">
              Your founder badge has been added to your Trophy Case.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleViewTrophyCase}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
            >
              <Trophy className="h-4 w-4 mr-2" />
              View My Trophy Case
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
