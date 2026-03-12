import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { redeemCode } from '@/lib/supabase/redeemCodes'
import { useUserProfile } from '@/context/UserProfileContext'
import { Loader2, Gift } from 'lucide-react'

interface RedeemCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RedeemCodeDialog({ open, onOpenChange, onSuccess }: RedeemCodeDialogProps) {
  const [code, setCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const { toast } = useToast()
  const { refreshProfile } = useUserProfile()

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: 'Code required',
        description: 'Please enter a redeem code.',
        variant: 'destructive',
      })
      return
    }

    setIsRedeeming(true)
    try {
      const result = await redeemCode(code.trim())

      if (result.success) {
        // Refresh profile to get updated badge
        await refreshProfile(true)
        
        // Small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 300))

        // Show success message
        if (result.badgeUnlocked === 'pokeverse_member') {
          toast({
            title: '✨ PokéVerse Tribute Unlocked!',
            description: 'You earned the DMV PokéVerse Member badge in recognition of the DMV PokéVerse community.',
            duration: 5000,
          })
        } else {
          toast({
            title: 'Code redeemed',
            description: 'Your code has been successfully redeemed.',
            duration: 3000,
          })
        }

        // Reset form and close dialog
        setCode('')
        onOpenChange(false)
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: 'Redeem failed',
          description: result.error || 'Failed to redeem code. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[RedeemCodeDialog] Error redeeming code:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isRedeeming) {
      handleRedeem()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Code
          </DialogTitle>
          <DialogDescription>
            Enter your redeem code to unlock badges and rewards.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter code"
              disabled={isRedeeming}
              className="w-full"
              autoFocus
            />
          </div>
          <Button
            onClick={handleRedeem}
            disabled={isRedeeming || !code.trim()}
            className="w-full"
          >
            {isRedeeming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Redeem
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
