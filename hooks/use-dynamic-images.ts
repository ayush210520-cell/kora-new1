import { useState, useEffect, useRef } from 'react'

export interface DynamicImage {
  id: string
  title: string
  description?: string
  imageUrl: string
  position: string
  category?: string
  isActive: boolean
  sortOrder: number
  altText?: string
  linkUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Position {
  value: string
  label: string
}

// Cache for dynamic images with timestamp
const imageCache = new Map<string, { data: DynamicImage[], timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds only - fresh data frequently

export const useDynamicImages = (position?: string) => {
  const [images, setImages] = useState<DynamicImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    fetchImages()
  }, [position])

  const fetchImages = async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) return
    
    const cacheKey = position || 'all'
    const cached = imageCache.get(cacheKey)
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached images:', cached.data.length)
      setImages(cached.data)
      setLoading(false)
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      
      const url = position 
        ? `/api/dynamic-images/position/${position}`
        : '/api/dynamic-images'
      
      console.log('🔄 Fetching images from:', url)
      
      // Increase timeout to 10 seconds for slow networks
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ API timeout after 10 seconds')
        controller.abort()
      }, 10000)
      
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store' // Don't use browser cache - always fresh
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const fetchedImages = data.images || []
      
      console.log('✅ Fetched images:', fetchedImages.length)
      
      // Always update cache and state with fetched data
      imageCache.set(cacheKey, { data: fetchedImages, timestamp: Date.now() })
      setImages(fetchedImages)
      
    } catch (err) {
      // On timeout or error, still set empty array
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('❌ Error fetching images:', err)
      setImages([]) // Empty array triggers fallback
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  // Function to clear cache - useful after creating/updating images
  const clearCache = () => {
    imageCache.clear()
    console.log('🗑️ Cache cleared')
  }

  return { images, loading, error, refetch: fetchImages, clearCache }
}

export const useDynamicImagePositions = () => {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPositions()
  }, [])

  const fetchPositions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dynamic-images/positions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch positions')
      }
      
      const data = await response.json()
      setPositions(data.positions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching positions:', err)
    } finally {
      setLoading(false)
    }
  }

  return { positions, loading, error, refetch: fetchPositions }
}
