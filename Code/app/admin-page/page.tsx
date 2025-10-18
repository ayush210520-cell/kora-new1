"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main admin page
    router.replace('/admin')
  }, [router])

  return null
}
