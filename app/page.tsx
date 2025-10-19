import { Suspense } from "react"
import SiteHeader from "@/components/site-header"
import HeroSlider from "@/components/hero-slider"
import ImageGallery from "@/components/image-gallery"
import PromotionalSection from "@/components/promotional-section"
import InstagramFeed from "@/components/instagram-feed"
import SiteFooter from "@/components/site-footer"
import ErrorBoundary from "@/components/error-boundary"
import { config } from '@/lib/config'

// Loading components
function HeroLoading() {
  return <div className="w-full h-screen bg-gray-100 animate-pulse" />
}

function GalleryLoading() {
  return <div className="w-full h-[600px] bg-gray-100 animate-pulse" />
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Fetch dynamic images on server side with caching (same pattern as products)
async function getDynamicImages() {
  try {
    const response = await fetch(`${config.apiUrl}/api/dynamic-images`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
      cache: 'force-cache' // Use cache for faster loads
    })

    if (response.ok) {
      const data = await response.json()
      return data.images || []
    }
    return []
  } catch (error) {
    console.error('Error fetching dynamic images:', error)
    return []
  }
}

export default async function Home() {
  // Fetch images on server side (fast like products page)
  const dynamicImages = await getDynamicImages()

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<HeroLoading />}>
            <HeroSlider initialImages={dynamicImages} />
          </Suspense>
        </ErrorBoundary>
        <Suspense fallback={<GalleryLoading />}>
          <ImageGallery initialImages={dynamicImages} />
        </Suspense>
        <PromotionalSection />
        <InstagramFeed />
      </main>
      <SiteFooter />
    </div>
  )
}
