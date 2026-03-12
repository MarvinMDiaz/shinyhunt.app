import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { checkIsAdmin } from '@/lib/supabase/admin'
import { SEO } from '@/components/SEO'

interface AdminGuardProps {
  children: React.ReactNode
}

/**
 * AdminGuard - Protects admin routes
 * 
 * Only allows access if:
 * 1. User is authenticated (from AuthContext)
 * 2. User exists in public.admin_users table (checked via Supabase)
 * 
 * Otherwise redirects to home page.
 * Uses database-backed admin check, not localStorage or hardcoded values.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAuthenticated, loadingAuth, user } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to finish loading
      if (loadingAuth) {
        return
      }

      setIsChecking(true)
      
      if (!isAuthenticated || !user) {
        toast({
          title: 'Access Denied',
          description: 'You must be logged in to access the admin portal.',
          variant: 'destructive',
        })
        navigate('/', { replace: true })
        setIsChecking(false)
        return
      }

      // Check admin_users table directly via Supabase
      const isAdmin = await checkIsAdmin()
      if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin portal.',
          variant: 'destructive',
        })
        navigate('/', { replace: true })
        setIsChecking(false)
        return
      }

      setHasAccess(true)
      setIsChecking(false)
    }

    checkAccess()
  }, [navigate, toast, isAuthenticated, loadingAuth, user])

  if (isChecking) {
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!hasAccess) {
    return null
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
      {children}
    </>
  )
}
