import { Suspense } from "react"
import { notFound } from "next/navigation"
import ProductDetails from "@/components/product-details"
import SimilarProductsSlider from "@/components/similar-products-slider"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { config } from '@/lib/config'

interface Product {
  id: string
  name: string
  price: number
  description: string
  images: Array<string | { url: string; public_id: string }>
  categoryId: string
  stock: number
  sizeStock?: { [key: string]: number } // Size-wise stock
  category?: {
    id: string
    name: string
  }
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Fetch product data on server side with aggressive caching
async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${config.apiUrl}/api/products/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { 
        revalidate: 60, // Cache for 60 seconds, then revalidate
        tags: [`product-${slug}`] // Tag for targeted revalidation
      },
      cache: 'force-cache' // Use cache when available for faster loads
    })

    if (response.ok) {
      const data = await response.json()
      return data.product
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Enhanced loading component for better perceived performance
function ProductLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-in fade-in-50 duration-300">
      <SiteHeader />
      <main className="flex-1 pt-[100px]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Desktop: Thumbnails skeleton */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-[140px] h-fit space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-full aspect-square bg-gray-200 rounded-md animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Mobile: Main image skeleton */}
            <div className="lg:hidden col-span-1">
              <div className="relative mb-6">
                <div className="relative rounded-lg overflow-hidden aspect-[2/3] bg-gray-200 animate-pulse"></div>
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Main images skeleton */}
            <div className="hidden lg:block lg:col-span-7">
              <div className="h-[600px] space-y-4 pr-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-[2/3] bg-gray-200 animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[140px] lg:h-fit space-y-6">
                {/* Breadcrumb skeleton */}
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>

                {/* Title skeleton */}
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>

                {/* Price skeleton */}
                <div className="flex items-baseline gap-2">
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-8 animate-pulse ml-auto"></div>
                </div>

                {/* Size selection skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 w-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>

                {/* Buttons skeleton */}
                <div className="flex flex-col gap-4">
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Description skeleton */}
                <div className="border-t pt-6">
                  <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// Product content component
async function ProductContent({ slug }: { slug: string }) {
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Transform product data to match ProductDetails component expectations
  const transformedProduct = {
    id: product.id,
    name: product.name,
    price: `${product.price}`,
    description: product.description,
    images: product.images.map(img => 
      typeof img === 'string' ? img : img.url
    ),
    sizes: ["XS", "S", "M", "L", "XL"], // Default sizes
    category: product.category?.name || 'Unknown',
    sizeStock: product.sizeStock, // Pass sizeStock data
    stock: product.stock // Pass total stock
  }

  return (
    <div className="animate-in fade-in-50 duration-500">
      <ProductDetails product={transformedProduct} />
      <SimilarProductsSlider 
        currentProductId={product.id} 
        currentCategoryId={product.categoryId} 
      />
    </div>
  )
}

export default async function SingleProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 pt-[100px]">
        <Suspense fallback={<ProductLoading />}>
          <ProductContent slug={slug} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  const productImage = product.images && product.images[0] 
    ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
    : '/placeholder.svg'

  return {
    title: `${product.name} | KORAKAGAZ`,
    description: product.description || `Buy ${product.name} at KORAKAGAZ. Premium quality traditional and party wear fashion.`,
    keywords: [
      product.name,
      'traditional fashion',
      'party wear',
      'ethnic wear',
      'korakagaz',
      product.category?.name || 'fashion'
    ],
    openGraph: {
      title: `${product.name} | KORAKAGAZ`,
      description: product.description || `Buy ${product.name} at KORAKAGAZ. Premium quality traditional and party wear fashion.`,
      images: [
        {
          url: productImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | KORAKAGAZ`,
      description: product.description || `Buy ${product.name} at KORAKAGAZ. Premium quality traditional and party wear fashion.`,
      images: [productImage],
    },
  }
}