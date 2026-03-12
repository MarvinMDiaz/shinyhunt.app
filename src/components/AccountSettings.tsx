import { useState, useEffect, useRef } from 'react'
import { User, LogOut, Camera, Mail, UserCircle, Award, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { useUserProfile } from '@/context/UserProfileContext'
import { useNavigate } from 'react-router-dom'
import { BadgeDisplay } from './BadgeDisplay'
import { uploadAvatar } from '@/lib/supabase/storage'
import { updateProfileAvatar } from '@/lib/supabase/auth'
import { useAdmin } from '@/hooks/useAdmin'
import { Settings } from 'lucide-react'
import type { BadgeId } from '@/lib/auth'

// Separator component - simple divider
const Separator = () => <div className="border-t border-border my-4" />

interface AccountSettingsProps {
  onSignOut: () => void
}

export function AccountSettings({ onSignOut }: AccountSettingsProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loadingProfile, updateAvatarUrl, refreshProfile } = useUserProfile()
  const { isAdmin, loading: loadingAdmin } = useAdmin()
  // Only use display_name for UI - never show internal username
  const [displayName, setDisplayName] = useState(
    profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  )
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update display name when profile changes - only use display_name, never username
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '')
    }
  }, [profile, user])

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a display name.',
        variant: 'destructive',
      })
      return
    }

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your display name.',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingName(true)
    try {
      const { updateProfileDisplayName } = await import('@/lib/supabase/auth')
      const { error } = await updateProfileDisplayName(user.id, displayName.trim())
      
      if (error) {
        throw error
      }

      // Refresh profile to get updated display_name
      await refreshProfile(true)
      
      toast({
        title: 'Name updated',
        description: 'Your display name has been updated.',
      })
    } catch (err) {
      console.error('Error updating display name:', err)
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update display name. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await onSignOut()
      navigate('/', { replace: true })
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      })
    } catch (error) {
      console.error('Error during sign out:', error)
      navigate('/', { replace: true })
      toast({
        title: 'Sign out error',
        description: 'An error occurred during sign out. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload an avatar.',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      // Upload to Supabase Storage
      const { url, error: uploadError } = await uploadAvatar(user.id, file)

      if (uploadError) {
        toast({
          title: 'Upload failed',
          description: uploadError.message || 'Failed to upload avatar. Please try again.',
          variant: 'destructive',
        })
        setIsUploadingAvatar(false)
        return
      }

      if (!url) {
        toast({
          title: 'Upload failed',
          description: 'Failed to get avatar URL. Please try again.',
          variant: 'destructive',
        })
        setIsUploadingAvatar(false)
        return
      }

      // Update profile with avatar URL
      const { error: updateError } = await updateProfileAvatar(user.id, url)

      if (updateError) {
        toast({
          title: 'Update failed',
          description: 'Avatar uploaded but failed to update profile. Please refresh.',
          variant: 'destructive',
        })
        setIsUploadingAvatar(false)
        return
      }

      // Immediately update context state for instant UI update across the app
      updateAvatarUrl(url)

      // Dispatch custom event to notify other components (like NavAvatar) to refresh
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: url } }))

      toast({
        title: 'Success!',
        description: 'Your profile picture has been updated.',
      })
    } catch (err) {
      console.error('Error uploading avatar:', err)
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleChangePictureClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* Badges Section */}
      {profile?.badges && Array.isArray(profile.badges) && profile.badges.length > 0 && (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Badges
              </h3>
              <p className="text-sm text-muted-foreground">
                Your achievements and recognition
              </p>
            </div>
            <BadgeDisplay badgeIds={(profile.badges || []).filter((b): b is BadgeId => 
              ['first_151_trainer', 'hundred_shiny_hunts', 'full_dex_completion', 'gen_1_master', 'ten_thousand_attempts'].includes(b)
            )} />
          </div>
          <Separator />
        </>
      )}

      {/* Profile Picture Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Update your profile picture
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            {loadingProfile ? (
              // Loading placeholder - prevents blank flash
              <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center animate-pulse">
                <UserCircle className="h-12 w-12 text-muted-foreground" />
              </div>
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                onError={() => {
                  // Fallback to default avatar if image fails to load
                  updateAvatarUrl(null)
                }}
              />
            ) : user ? (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <UserCircle className="h-12 w-12 text-primary/60" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <UserCircle className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangePictureClick}
              disabled={isUploadingAvatar || !user}
              className="w-full sm:w-auto"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Picture
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Display Name Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Display Name</h3>
          <p className="text-sm text-muted-foreground">
            Your name as it appears to you
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Name</Label>
          <div className="flex gap-2">
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="flex-1"
            />
            <Button
              onClick={handleUpdateName}
              disabled={isUpdatingName || displayName === (profile?.display_name || '')}
              size="default"
            >
              {isUpdatingName ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Account Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Account Information</h3>
          <p className="text-sm text-muted-foreground">
            Your account details
          </p>
        </div>
        <div className="space-y-3">
          {user?.email && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
          )}
          {profile?.signup_number && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {profile?.founder_badge ? 'Founder' : 'Trainer Number'}
                </p>
                <p className="text-sm font-medium">
                  {profile?.founder_badge ? `Founder #${profile.signup_number}` : `#${profile.signup_number}`}
                </p>
              </div>
            </div>
          )}
          {user?.created_at && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Admin Section - Only visible to admins */}
      {!loadingAdmin && isAdmin === true && (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Admin</h3>
              <p className="text-sm text-muted-foreground">
                Access the admin dashboard
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
          </div>
          <Separator />
        </>
      )}

      {/* Sign Out Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Sign Out</h3>
          <p className="text-sm text-muted-foreground">
            Sign out of your account
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
