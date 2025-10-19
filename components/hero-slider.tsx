"use client"

import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { DynamicImage } from "@/hooks/use-dynamic-images"

// Fallback images if no dynamic images are available
const fallbackImages = [
  "/A.JPG", // SS2566.jpg - Gold earrings
  "/B.JPG", // SS3081.jpg - Orange silk top
  "/C.JPG", // a.webp - New product image
  "/D.JPG", // b.webp - New product image
  "/E.JPG", // c.webp - New product image// SS7010.jpg - Product image
]

// Optimize image URLs for faster loading
const getOptimizedImageUrl = (src: string) => {
  if (!src) return "/placeholder.jpg"
  try {
    // For local images, return as is
    if (src.startsWith('/')) {
      return src
    }
    
    // For CloudFront images, use directly for CDN performance
    if (src.includes('cloudfront.net')) {
      return src; // CloudFront already optimized and cached
    }
    
    // For S3 images, convert to CloudFront for better performance
    if (src.includes('korakagazindia.s3.ap-south-1.amazonaws.com')) {
      return src.replace('korakagazindia.s3.ap-south-1.amazonaws.com', 'd22mx6u12sujnm.cloudfront.net');
    }
    
    return src
  } catch {
    return "/placeholder.jpg"
  }
}

interface HeroSliderProps {
  initialImages?: DynamicImage[]
}

export default function HeroSlider({ initialImages = [] }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  
  // Use server-fetched images (fast like products page)
  const heroImages = initialImages
    .filter(img => img.position.startsWith('hero-slider-'))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(img => ({
      src: img.imageUrl,
      alt: img.altText || img.title,
      linkUrl: img.linkUrl || '/products'
    }))
  
  const fallbackImageObjects = fallbackImages.map(src => ({
    src,
    alt: `Hero Image ${fallbackImages.indexOf(src) + 1}`,
    linkUrl: '/products'
  }))
  
  // Use dynamic images if available, otherwise fallback (instant, no loading state)
  const images = heroImages.length > 0 ? heroImages : fallbackImageObjects

  // Auto-advance slider
  useEffect(() => {
    if (images.length === 0) return
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [images.length])

  const handleImageClick = useCallback((linkUrl: string) => {
    router.push(linkUrl)
  }, [router])



  // No loading state - use fallback images immediately for instant display
  // Dynamic images will load in background if available

  return (
    <div className="w-full">
      <section className="w-full h-screen relative overflow-hidden">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
              index === currentIndex ? "translate-x-0" : index < currentIndex ? "-translate-x-full" : "translate-x-full"
            }`}
          >
            <div 
              className="w-full h-full cursor-pointer relative group"
              onClick={() => handleImageClick(image.linkUrl)}
            >
              <Image
                src={getOptimizedImageUrl(image.src)}
                alt={image.alt}
                fill
                style={{ objectFit: "cover" }}
                quality={95}
                priority={true}
                loading="eager"
                sizes="100vw"
                className="transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.error('Hero image failed to load:', image.src);
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />
              {/* Shop Now overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 px-6 py-3 rounded-sm shadow-lg">
                  <p className="text-primary-brand font-medium text-lg">Shop Now</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* White border with All Products text */}
      <div className="w-full bg-primary-brand border-white h-[80px] sm:h-[100px] md:h-[120px] px-4 sm:px-8 md:px-16 lg:px-32 xl:px-40 flex items-center justify-center overflow-hidden">
          <Link href="/products" prefetch={true} className="block">
          <h2 className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl tracking-wide transform transition-all duration-700 ease-in-out hover:scale-105 hover:tracking-widest cursor-pointer border border-white px-3 py-1 sm:px-4 sm:py-2 md:px-6 md:py-2 rounded-full hover:bg-white hover:text-primary-brand shadow-md hover:shadow-xl whitespace-nowrap">
            <span className="inline-block transition-transform duration-300 hover:translate-y-[-2px]">A</span>
            <span className="inline-block transition-transform duration-300 delay-75 hover:translate-y-[-2px]">L</span>
            <span className="inline-block transition-transform duration-300 delay-150 hover:translate-y-[-2px]">L</span>
            <span className="inline-block mx-0.5 sm:mx-1 transition-transform duration-300 delay-225 hover:translate-y-[-2px]"> </span>
            <span className="inline-block transition-transform duration-300 delay-300 hover:translate-y-[-2px]">P</span>
            <span className="inline-block transition-transform duration-300 delay-375 hover:translate-y-[-2px]">R</span>
            <span className="inline-block transition-transform duration-300 delay-450 hover:translate-y-[-2px]">O</span>
            <span className="inline-block transition-transform duration-300 delay-525 hover:translate-y-[-2px]">D</span>
            <span className="inline-block transition-transform duration-300 delay-600 hover:translate-y-[-2px]">U</span>
            <span className="inline-block transition-transform duration-300 delay-675 hover:translate-y-[-2px]">C</span>
            <span className="inline-block transition-transform duration-300 delay-750 hover:translate-y-[-2px]">T</span>
            <span className="inline-block transition-transform duration-300 delay-825 hover:translate-y-[-2px]">S</span>
          </h2>
        </Link>
      </div>
    </div>
  )
}
