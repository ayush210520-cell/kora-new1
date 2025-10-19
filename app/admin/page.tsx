"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAdmin } from '@/contexts/auth-context'

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useRequireAdmin()
  
  // Redirect to dashboard when admin access is confirmed
  useEffect(() => {
    if (isAdmin && !authLoading) {
      router.push('/admin/dashboard')
    }
  }, [isAdmin, authLoading, router])


  return null
}
