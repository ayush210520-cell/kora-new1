'use client'

import { useAuth } from '@/contexts/auth-context'
import ComingSoon from './coming-soon'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If user is not admin and trying to access any page except login and home, redirect to home
    if (!isLoading && !isAdmin && pathname !== '/login' && pathname !== '/') {
      router.push('/')
    }
    
    // If user is admin and on login page, redirect to admin dashboard
    if (!isLoading && isAdmin && pathname === '/login') {
      router.push('/admin/dashboard')
    }
  }, [isAdmin, isLoading, pathname, router])

  // Show coming soon page immediately for non-admin users, even during loading
  if (!isAdmin && pathname !== '/login') {
    return <ComingSoon />
  }

  // If admin access is required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <ComingSoon />
  }

  // If user is admin, show the protected content
  if (isAdmin) {
    return <>{children}</>
  }

  // For login page, show the children (login form)
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Default fallback
  return <ComingSoon />
}