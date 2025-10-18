// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  // Check if cache is expired
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

export function setCachedData<T>(key: string, data: T, ttl: number = 300000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

export function clearCache(): void {
  cache.clear()
}

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  PRODUCT: (id: string) => `product-${id}`,
  INSTAGRAM_POSTS: 'instagram-posts',
} as const
