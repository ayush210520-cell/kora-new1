import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import ProductsWrapper from "@/components/products-wrapper"
import { config } from '@/lib/config'

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Fetch products on server side with caching
async function getProducts() {
  try {
    const response = await fetch(`${config.apiUrl}/api/products?limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
      cache: 'force-cache' // Use cache for faster loads
    })

    if (response.ok) {
      const data = await response.json()
      return data.products || []
    }
    return []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// Fetch categories on server side with caching
async function getCategories() {
  try {
    const response = await fetch(`${config.apiUrl}/api/products/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 600 } // Cache for 10 minutes (categories change less frequently)
    })

    if (response.ok) {
      const data = await response.json()
      return data.categories || []
    }
    return []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}



export default async function ProductsPage() {
  // Fetch data on server side
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ])

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pt-24">
        <ProductsWrapper 
          initialProducts={products} 
          initialCategories={categories}
        />
      </main>
      <SiteFooter />
    </>
  )
}