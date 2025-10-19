"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function OurStoryContent() {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleImageClick = () => {
    // Redirect to products page when images are clicked
    router.push('/products')
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-4 pb-4 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <Image
              src="/logofinal.png"
              alt="Korakagaz Logo"
              width={80}
              height={80}
              className="h-28 w-28 md:h-32 md:w-32 lg:h-36 lg:w-36"
            />
            <img
              src="/firstlogo.png"
              alt="KORAKAGAZ"
              className="h-10 sm:h-12 md:h-16 lg:h-20 transition-all duration-300"
            />
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-0">
              A blank page. A fresh start. And a whole lot of heart.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1 - Text Left, Image Right */}
      <section className="pt-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-6 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
              <div className="space-y-4 text-gray-600 leading-relaxed text-center">
                <p>
                  We call ourselves KORAKAGAZ- because that's what we are.
                </p>
                <p>
                  A fresh start. A clean slate.
                </p>
                <p>
                  And if you've ever hit reset on your life (mentally, emotionally, or via haircut), well, you already get us.
                </p>
                <p>
                  We started from scratch, just like many of you.
                </p>
                <p>
                  The ones who've felt stuck.
                </p>
                <p>
                  The ones who've said "Now what?"
                </p>
                <p>
                  And the ones brave enough to say, "Let's begin again."
                </p>
              </div>
            </div>
            <div className={`${isVisible ? "animate-fade-in-up delay-300" : "opacity-0"}`}>
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg"
                onClick={handleImageClick}
                title="Click to view all products"
              >
                <Image
                  src="/DSI01573.JPG"
                  alt="KORAKAGAZ Story"
                  width={1000}
                  height={600}
                  className="rounded-lg shadow-lg object-cover transition-transform duration-300 group-hover:scale-105 w-full h-[500px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Image Left, Text Right */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`order-2 lg:order-1 ${isVisible ? "animate-fade-in-up delay-600" : "opacity-0"}`}>
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg"
                onClick={handleImageClick}
                title="Click to view all products"
              >
                <Image
                  src="/DSI02448.JPG"
                  alt="KORAKAGAZ Story"
                  width={1000}
                  height={600}
                  className="rounded-lg shadow-lg object-cover transition-transform duration-300 group-hover:scale-105 w-full h-[500px]"
                />
              </div>
            </div>
            <div className={`order-1 lg:order-2 space-y-6 ${isVisible ? "animate-fade-in-up delay-900" : "opacity-0"}`}>
              <div className="space-y-4 text-gray-600 leading-relaxed text-center">
                <p>
                  We're a work-in-progress — just like you, and that's the fun of it.
                </p>
                <p>
                  Our pieces are simple, beautiful, and functional because we're here for the real stuff-
                  the Monday meetings, the late-night crying-into-your-pillow sessions, the spontaneous brunches, the solo trips, the bad dates, the good decisions, and the even better naps.
                </p>
                <p>
                  We don't judge.
                </p>
                <p>
                  Our fabrics are soft, breathable, and built for real life, not just Instagram.
                </p>
                <p>
                  At KoraKagaz, we believe clothes should move with you, not hold you back.
                </p>
                <p>
                  They should make you feel like you - bold, silly, strong, soft, whatever the mood says today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Full Width Quote */}
      <section className="py-20 bg-primary-brand relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full animate-spin-slow"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-white/20 rotate-45 animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-32 right-1/3 w-8 h-8 border-2 border-white/20 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20">
              <div className={`space-y-6 ${isVisible ? "animate-fade-in-up delay-1200" : "opacity-0"}`}>
                <div className="space-y-4 text-white leading-relaxed">
                  <p className="text-lg md:text-xl">
                    We aren't chasing trends.
                  </p>
                  <p className="text-lg md:text-xl">
                    We're creating a space where women can be anything they wish to be. Because we believe every woman deserves a wardrobe that feels like home.
                  </p>
                  <p className="text-lg md:text-xl">
                    And here's the best part:
                  </p>
                  <p className="text-lg md:text-xl">
                    If you're reading this, you're not just scrolling by. You're part of this story.
                  </p>
                  <p className="text-lg md:text-xl">
                    So thanks for being here, really.
                  </p>
                  <p className="text-lg md:text-xl">
                    We're still writing this.
                  </p>
                  <p className="text-lg md:text-xl">
                    And the pages? They're looking pretty exciting with you in them.
                  </p>
                  <p className="text-lg md:text-xl">
                    Here's to fresh starts.
                  </p>
                  <p className="text-lg md:text-xl font-semibold">
                    Here's to KORAKAGAZ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  )
}
