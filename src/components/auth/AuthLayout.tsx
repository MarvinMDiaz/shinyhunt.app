import { ReactNode } from 'react'
import { FloatingSparkles } from '@/components/FloatingSparkles'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background with sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800" />
        <FloatingSparkles goldCount={15} cyanCount={10} themeId="default" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
