'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ComingSoon() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Here you can add email subscription logic
      setIsSubscribed(true)
      setTimeout(() => {
        setIsSubscribed(false)
        setEmail('')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}

        <div className="mb-8">
          <Image
            src="/logofinal.png"
            alt="KORAKAGAZ INDIA Logo"
            width={120}
            height={100}
            className="mx-auto mb-4"
            priority
          />
        </div>
        <div className="mb-8">
          <Image
            src="/firstlogo.png"
            alt="KORAKAGAZ INDIA Logo"
            width={300}
            height={120}
            className="mx-auto mb-4"
            priority
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-1xl shadow-2xl p-8 md:p-12 mb-8">
          <h1 className="text-xl md:text-6xl font-bold text-amber-900 mb-6">
            Coming Soon...
          </h1>
          
        </div>

        {/* Footer */}
        
      </div>
    </div>
  )
}
