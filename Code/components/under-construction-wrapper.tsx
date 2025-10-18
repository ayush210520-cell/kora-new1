'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import UnderConstruction from './under-construction'
import { ReactNode } from 'react'

interface UnderConstructionWrapperProps {
  children: ReactNode
}

export function UnderConstructionWrapper({ children }: UnderConstructionWrapperProps) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700">Loading...</p>
        </div>
      </div>
    )
  }

  // Always allow access to login page
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Always allow access if user is authenticated (logged in)
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show under construction page for non-authenticated users
  return <UnderConstruction />
}
