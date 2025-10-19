"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Heart, MessageCircle, Share2, Bookmark, RefreshCw } from "lucide-react"
import { config } from "@/lib/config"
import { getCachedData, setCachedData, CACHE_KEYS } from "@/lib/cache"
import Image from "next/image"
import InstagramModal from "@/components/instagram-modal"

interface InstagramPost {
  id: string
  image: string
  videoUrl?: string
  caption: string
  likes: number
  comments: number
  username: string
  userAvatar: string
  timestamp: string
  permalink?: string
  mediaType?: string
  commentsList: Array<{
    id: string
    username: string
    comment: string
    timestamp: string
  }>
}

const InstagramFeed = memo(function InstagramFeed() {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Proxy function to handle Instagram CDN images
  const getProxiedImageUrl = useCallback((originalUrl: string) => {
    // If it's an Instagram CDN URL, use our proxy
    if (originalUrl.includes('scontent-') && originalUrl.includes('cdninstagram.com')) {
      const encodedUrl = encodeURIComponent(originalUrl)
      return `${config.apiUrl}/api/proxy/instagram/${encodedUrl}`
    }
    // For other images (like fallback images), return as is
    return originalUrl
  }, [])

  // Fallback posts for when Instagram API fails
  const getFallbackPosts = () => [
    {
      id: 'fallback-1',
      image: '/SS2566.jpg',
      caption: 'Beautiful traditional wear from KORAKAGAZ',
      likes: 45,
      comments: 8,
      username: 'korakagaz.india',
      userAvatar: '/logofinal.png',
      timestamp: '2 hours ago',
      commentsList: []
    },
    {
      id: 'fallback-2', 
      image: '/SS3081.jpg',
      caption: 'Elegant kurti sets for every occasion',
      likes: 32,
      comments: 5,
      username: 'korakagaz.india',
      userAvatar: '/logofinal.png',
      timestamp: '5 hours ago',
      commentsList: []
    },
    {
      id: 'fallback-3',
      image: '/DSI01750.JPG',
      caption: 'New collection now available',
      likes: 28,
      comments: 3,
      username: 'korakagaz.india', 
      userAvatar: '/logofinal.png',
      timestamp: '1 day ago',
      commentsList: []
    }
    
  ]

  // Fetch Instagram posts from API with caching
  const fetchPosts = useCallback(async (forceRefresh = false) => {
    try {
      setIsRefreshing(true)
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedPosts = getCachedData<InstagramPost[]>(CACHE_KEYS.INSTAGRAM_POSTS)
        if (cachedPosts) {
          console.log('📦 Using cached Instagram posts:', cachedPosts.length)
          setPosts(cachedPosts)
          setIsLoading(false)
          setIsRefreshing(false)
          return
        }
      }
      
      console.log('🔄 Fetching Instagram posts from:', `${config.apiUrl}/api/instagram/posts?limit=9`)
      
      const response = await fetch(`${config.apiUrl}/api/instagram/posts?limit=9`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setPosts(data.data)
        // Cache the posts for 10 minutes (600000ms)
        setCachedData(CACHE_KEYS.INSTAGRAM_POSTS, data.data, 600000)
        console.log('✅ Instagram posts fetched and cached:', data.data.length)
      } else {
        console.error('❌ Failed to fetch Instagram posts:', data.error)
        // Use fallback posts if API fails
        setPosts(getFallbackPosts())
      }
    } catch (error) {
      console.error('❌ Error fetching Instagram posts:', error)
      // Use fallback posts if API fails
      setPosts(getFallbackPosts())
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Auto-refresh posts every 10 minutes (reduced frequency for better performance)
  useEffect(() => {
    fetchPosts()
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing Instagram posts...')
      fetchPosts(true) // Force refresh for auto-refresh
    }, 10 * 60 * 1000) // 10 minutes (increased from 5 minutes)

    return () => clearInterval(interval)
  }, [fetchPosts])

  const handleImageClick = useCallback((post: InstagramPost) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedPost(null)
  }, [])

  const handleRefresh = useCallback(() => {
    fetchPosts(true) // Force refresh when user clicks refresh
  }, [fetchPosts])

  const handleExternalLink = useCallback((permalink: string) => {
    if (permalink) {
      window.open(permalink, '_blank')
    }
  }, [])

  // Memoized Instagram post component for better performance
  const InstagramPostItem = memo(({ post }: { post: InstagramPost }) => {
    const handleVideoPlay = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
      e.currentTarget.play()
    }, [])

    const handleVideoPause = useCallback((e: React.MouseEvent<HTMLVideoElement>) => {
      e.currentTarget.pause()
    }, [])

    return (
      <div
        className="group cursor-pointer overflow-hidden shadow-sm sm:shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => handleImageClick(post)}
      >
        <div className="relative aspect-[1/1.15]">
          {post.mediaType === 'VIDEO' && post.videoUrl ? (
            <video
              src={post.videoUrl}
              poster={getProxiedImageUrl(post.image)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              muted
              loop
              playsInline
              onMouseEnter={handleVideoPlay}
              onMouseLeave={handleVideoPause}
              preload="metadata" // Only load metadata initially
              onError={(e) => {
                console.error('❌ Failed to load Instagram video:', post.videoUrl);
              }}
            />
          ) : (
            <img
              src={getProxiedImageUrl(post.image)}
              alt={post.caption}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                console.error('❌ Failed to load Instagram image:', getProxiedImageUrl(post.image));
                // Fallback to original URL if proxy fails
                if (e.currentTarget.src !== post.image) {
                  e.currentTarget.src = post.image;
                }
              }}
            />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {post.mediaType === 'VIDEO' ? (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  })

  InstagramPostItem.displayName = 'InstagramPostItem'

  // Memoized loading skeleton
  const LoadingSkeleton = memo(() => (
    Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="w-full aspect-[1/1.15] bg-gradient-to-br from-gray-200 to-gray-300"></div>
      </div>
    ))
  ))

  LoadingSkeleton.displayName = 'LoadingSkeleton'

  // Memoized posts grid
  const postsGrid = useMemo(() => {
    if (isLoading) {
      return <LoadingSkeleton />
    }
    
    if (posts.length > 0) {
      return posts.map((post) => (
        <InstagramPostItem key={post.id} post={post} />
      ))
    }
    
    return <LoadingSkeleton />
  }, [isLoading, posts])

  return (
    <>
      {/* Instagram Feed Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <h2 className="text-3xl md:text-4xl font-light text-primary-brand">
                FOLLOW US ON INSTAGRAM
              </h2>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-primary-brand hover:text-primary-brand/80 transition-colors disabled:opacity-50"
                title="Refresh Instagram posts"
              >
                <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <a 
              href="https://instagram.com/korakagaz.india" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lg text-primary-brand font-medium hover:text-primary-brand/80 transition-colors cursor-pointer"
            >
              @{posts.length > 0 ? posts[0].username : 'KORAKAGAZ'}
            </a>
            {isRefreshing && (
              <p className="text-sm text-primary-brand mt-2">🔄 Refreshing posts...</p>
            )}
          </div>

          {/* Instagram Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-0 max-w-6xl mx-auto">
            {postsGrid}
          </div>

          {/* Instagram Status Message */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-300 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Instagram Feed Loading</h3>
                <p className="text-gray-500 mb-4">We're connecting to Instagram to show your latest posts. This may take a few moments.</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-brand/90 transition-colors"
                  >
                    Refresh Now
                  </button>
                  <a
                    href="https://instagram.com/korakagaz.india"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View on Instagram
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Instagram Modal */}
      <InstagramModal 
        post={selectedPost ? {
          id: selectedPost.id,
          username: selectedPost.username,
          userAvatar: selectedPost.userAvatar,
          image: selectedPost.image,
          video: selectedPost.videoUrl,
          caption: selectedPost.caption,
          likes: selectedPost.likes,
          comments: selectedPost.comments,
          date: selectedPost.timestamp,
          isVideo: selectedPost.mediaType === 'VIDEO'
        } : null}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  )
})

export default InstagramFeed
