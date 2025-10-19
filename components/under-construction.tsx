"use client"

import Image from 'next/image'

export default function UnderConstruction() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-center">
        <Image
          src="/logokorabrown.png"
          alt="KORAKAGAZ Logo"
          width={200}
          height={80}
          className="mx-auto mb-4"
          priority
        />
        <p className="text-xl text-gray-800">Under Construction</p>
      </div>
    </div>
  )
}
