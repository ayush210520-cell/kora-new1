"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { config } from '@/lib/config'

interface SimilarProduct {
  id: string
  name: string
  price: number
  images: Array<{ url: string; public_id: string }>
  categoryId: string
}

interface SimilarProductsSliderProps {
  currentProductId: string
  currentCategoryId: string
}

// Enhanced skeleton loading component
const ProductSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
    <div className="h-72 sm:h-80 lg:h-96 xl:h-[28rem] bg-gray-200 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-brand rounded-full animate-spin"></div>
    </div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
)

export default function SimilarProductsSlider({ 
  currentProductId, 
  currentCategoryId 
}: SimilarProductsSliderProps) {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({})
  const [imageErrorStates, setImageErrorStates] = useState<Record<string, boolean>>({})

  // Optimize image URLs - prioritize CloudFront for better performance
  const getOptimizedImageUrl = useCallback((src: string) => {
    if (!src) return "/placeholder.jpg"
    try {
      // S3/CloudFront optimization - use CloudFront URLs directly
      if (src.includes('cloudfront.net') || (src.includes('.s3.') && src.includes('.amazonaws.com'))) {
        // For CloudFront URLs, return directly for CDN benefits
        if (src.includes('cloudfront.net')) {
          return src; // Use CloudFront URL directly
        }
        
        // For S3 URLs, convert to CloudFront for better performance
        if (src.includes('korakagazindia.s3.ap-south-1.amazonaws.com')) {
          return src.replace('korakagazindia.s3.ap-south-1.amazonaws.com', 'd22mx6u12sujnm.cloudfront.net');
        }
        
        // For any other S3 URL, return as-is
        return src;
      }
      
      // Cloudinary fallback - maintain high quality
      if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
        return src.replace('/upload/', '/upload/w_500,h_750,c_fill,f_auto,q_auto:best/')
      }
      
      return src
    } catch {
      return "/placeholder.jpg"
    }
  }, [])

  // Fetch similar products with caching
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch products from the same category, excluding current product
        const response = await fetch(`${config.apiUrl}/api/products?category=${currentCategoryId}&limit=10`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 } // Cache for 5 minutes
        })
        
        if (response.ok) {
          const data = await response.json()
          const products = data.products || []
          
          // Filter out current product and limit to 8 products
          const filtered = products
            .filter((product: SimilarProduct) => product.id !== currentProductId)
            .slice(0, 8)
          
          setSimilarProducts(filtered)
          
          // Initialize loading states for all products
          const loadingStates: Record<string, boolean> = {}
          filtered.forEach((product: SimilarProduct) => {
            loadingStates[product.id] = true
          })
          setImageLoadingStates(loadingStates)

          // Preload first few images for faster display
          filtered.slice(0, 4).forEach((product: SimilarProduct) => {
            if (product.images && product.images[0]) {
              const img = new window.Image()
              img.src = getOptimizedImageUrl(typeof product.images[0] === 'string' 
                ? product.images[0] 
                : product.images[0].url)
            }
          })
        } else {
          setError('Failed to fetch similar products')
        }
      } catch (error) {
        console.error('Error fetching similar products:', error)
        setError('Failed to load similar products')
      } finally {
        setIsLoading(false)
      }
    }

    if (currentCategoryId) {
      fetchSimilarProducts()
    }
  }, [currentProductId, currentCategoryId])

  // Memoized navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, similarProducts.length - 4) : prev - 1
    )
  }, [similarProducts.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => 
      prev >= similarProducts.length - 4 ? 0 : prev + 1
    )
  }, [similarProducts.length])

  // Memoized visible products
  const visibleProducts = useMemo(() => {
    return similarProducts.slice(currentIndex, currentIndex + 4)
  }, [similarProducts, currentIndex])

  // Format price
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }, [])

  // Don't render if no similar products - Remove skeleton for faster perceived load
  if (isLoading) {
    return null // Don't show anything while loading - faster perceived performance
  }

  if (error || similarProducts.length === 0) {
    return null // Don't show section if no similar products
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary-brand mb-2">Similar Products</h2>
        <p className="text-gray-600">You might also like these products</p>
      </div>

      <div className="relative">
        {/* Navigation buttons - Hidden on mobile, shown on desktop */}
        {similarProducts.length > 4 && (
          <>
            <Button
              onClick={goToPrevious}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg hover:bg-gray-50"
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={goToNext}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg hover:bg-gray-50"
              size="icon"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Products grid - Mobile: horizontal scroll, Desktop: grid */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 animate-in fade-in-50 duration-500">
          {visibleProducts.map((product, index) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex-shrink-0 w-64 sm:w-auto"
            >
              <div className="relative overflow-hidden">
                <div className="h-72 sm:h-80 lg:h-96 xl:h-[28rem] relative">
                  {imageLoadingStates[product.id] && (
                    <div className="absolute inset-0 bg-white animate-pulse rounded-t-lg flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-brand rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  <Image
                    src={product.images && product.images[0] 
                      ? getOptimizedImageUrl(typeof product.images[0] === 'string' 
                          ? product.images[0] 
                          : product.images[0].url)
                      : "/placeholder.jpg"
                    }
                    alt={product.name}
                    fill
                    className={`object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-lg ${
                      imageLoadingStates[product.id] ? 'opacity-0' : 'opacity-100'
                    }`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    priority={index < 2}
                    loading={index < 2 ? "eager" : "lazy"}
                    quality={90}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    onLoad={() => {
                      setImageLoadingStates(prev => ({ ...prev, [product.id]: false }))
                    }}
                    onError={(e) => {
                      console.error('Similar product image failed to load:', product.images?.[0]);
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      setImageErrorStates(prev => ({ ...prev, [product.id]: true }))
                      setImageLoadingStates(prev => ({ ...prev, [product.id]: false }))
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-primary-brand mb-2 line-clamp-2 group-hover:text-primary-brand/80 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary-brand font-medium">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dots indicator - Hidden on mobile, shown on desktop */}
        {similarProducts.length > 4 && (
          <div className="hidden sm:flex justify-center mt-6 space-x-2">
            {Array.from({ length: Math.ceil(similarProducts.length / 4) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === Math.floor(currentIndex / 4)
                    ? "bg-primary-brand"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}