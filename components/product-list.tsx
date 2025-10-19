"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { config } from "@/lib/config"

interface Product {
  id: string
  name: string
  price: number
  description: string
  images: Array<string | { url: string; public_id: string }>
  categoryId: string
  stock: number
  sizeStock?: { [key: string]: number } // Size-wise stock
  slug?: string
}

interface Category {
  id: string
  name: string
}

interface ProductListProps {
  initialProducts?: Product[]
  initialCategories?: Category[]
  category?: string
}


// Skeleton Loading Component
const ProductSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
    <div className="h-72 sm:h-80 lg:h-96 xl:h-[28rem] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-brand rounded-full animate-spin"></div>
    </div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
)

export default function ProductList({ initialProducts = [], initialCategories = [], category: propCategory }: ProductListProps) {
  // Optimize image URLs - prioritize S3/CloudFront for better performance
  const getOptimizedImageUrl = (src: string) => {
    if (!src) return "/placeholder.jpg";
    try {
      // S3/CloudFront optimization - primary choice for best performance
      if (src.includes('cloudfront.net') || (src.includes('.s3.') && src.includes('.amazonaws.com'))) {
        const url = new URL(src);
        // High quality optimization for S3 images
        url.searchParams.set('f', 'auto'); // Auto format (WebP, AVIF) - maintains quality
        url.searchParams.set('q', 'best'); // Best quality compression
        url.searchParams.set('w', '600'); // High resolution for product cards
        url.searchParams.set('h', '900');
        return url.toString();
      }
      
      // Cloudinary fallback - maintain high quality
      if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
        return src.replace('/upload/', '/upload/w_600,h_900,c_fill,f_auto,q_auto:best/');
      }
      
      return src;
    } catch {
      return "/placeholder.jpg";
    }
  };
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("featured")

  // Preload first few product images for faster loading
  useEffect(() => {
    if (products.length > 0) {
      const preloadImages = products.slice(0, 6).map(product => {
        if (product.images && product.images[0]) {
          const imageUrl = typeof product.images[0] === 'string'
            ? getOptimizedImageUrl(product.images[0])
            : getOptimizedImageUrl((product.images[0] as { url: string }).url)
          
          const img = new window.Image()
          img.src = imageUrl
          return img
        }
        return null
      }).filter(Boolean)
      
      console.log(`🚀 Preloading ${preloadImages.length} product images`)
    }
  }, [products])
  const [visibleProducts, setVisibleProducts] = useState(8) // Lower initial render for faster first paint
  const [sizePopupOpen, setSizePopupOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState("M")
  const searchParams = useSearchParams()
  const category = propCategory || searchParams?.get("category") || ""
  const { addToCart } = useCart()
  const { toast } = useToast()
  const popupRef = useRef<HTMLDivElement>(null)

  const openSizePopup = (product: Product) => {
    setSelectedProduct(product)
    setSelectedSize("M")
    setSizePopupOpen(true)
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return
    
    // Check if selected size is available - only if sizeStock exists and > 0
    const isAvailable = selectedProduct.sizeStock && selectedProduct.sizeStock[selectedSize] !== undefined && selectedProduct.sizeStock[selectedSize] > 0;
    
    if (!isAvailable) {
      toast({
        title: "Out of Stock",
        description: `Size ${selectedSize} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }
    
    addToCart({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: `₹${selectedProduct.price}`,
      image: selectedProduct.images && selectedProduct.images[0] 
        ? (typeof selectedProduct.images[0] === 'string' ? selectedProduct.images[0] : selectedProduct.images[0].url)
        : "/placeholder.svg",
      size: selectedSize,
      slug: selectedProduct.id
    })
    
    toast({
      title: "Added to Cart!",
      description: `${selectedProduct.name} (${selectedSize}) has been added to your cart.`,
      duration: 3000,
    })
    
    setSizePopupOpen(false)
    setSelectedProduct(null)
  }

  // Handle click outside popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setSizePopupOpen(false)
        setSelectedProduct(null)
      }
    }

    if (sizePopupOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sizePopupOpen])

  // Only fetch if no initial data provided
  useEffect(() => {
    if (initialProducts.length === 0) {
      const fetchData = async () => {
        try {
          setIsLoading(true)
          setError(null)
          
          const [productsResponse, categoriesResponse] = await Promise.all([
            fetch(`${config.apiUrl}/api/products`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }),
            fetch(`${config.apiUrl}/api/products/categories`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            })
          ])
          
          if (productsResponse.ok) {
            const productsData = await productsResponse.json()
            setProducts(productsData.products || [])
          } else {
            setError(`Failed to fetch products: ${productsResponse.status}`)
          }
          
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json()
            setCategories(categoriesData.categories || [])
          }
        } catch (error) {
          console.error('❌ Network error:', error)
          setError(error instanceof Error ? error.message : 'An unknown error occurred')
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    } else {
      // Use initial data and set loading to false immediately
      setProducts(initialProducts)
      setCategories(initialCategories)
      setIsLoading(false)
    }
  }, [initialProducts.length, initialProducts, initialCategories])

  // Memoized filtered and sorted products for better performance
  const { filteredProducts, sortedProducts } = useMemo(() => {
    const filtered = category && category !== "all" 
      ? products.filter((product) => {
          const productCategory = categories.find(c => c.id === product.categoryId)
          if (!productCategory) return false
          const categorySlug = productCategory.name.toLowerCase().replace(/\s+/g, '-')
          return categorySlug === category
        })
      : products

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return { filteredProducts: filtered, sortedProducts: sorted }
  }, [products, categories, category, sortBy])

  const loadMore = () => {
    setVisibleProducts((prev) => Math.min(prev + 12, filteredProducts.length))
  }

  const getPageTitle = () => {
    // Show category name if selected, otherwise "Products"
    if (!category || category === "all") return "Products"
    
    const selectedCategory = categories.find(c => {
      const categorySlug = c.name.toLowerCase().replace(/\s+/g, '-')
      return categorySlug === category
    })
    
    return selectedCategory ? selectedCategory.name : "Products"
  }
  
  const getSelectedCategoryName = () => {
    if (!category || category === "all") return "ALL PRODUCTS"
    
    const selectedCategory = categories.find(c => {
      const categorySlug = c.name.toLowerCase().replace(/\s+/g, '-')
      return categorySlug === category
    })
    
    return selectedCategory ? selectedCategory.name.toUpperCase() : "ALL PRODUCTS"
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-in fade-in-50 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Products</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary-brand text-white px-6 py-2 rounded-lg hover:bg-primary-brand/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in-50 duration-500">
      {/* Header with Title and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* Desktop: Show title, Mobile: Show category dropdown */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-primary-brand">{getPageTitle()}</h1>
          {/* Mobile Category Dropdown */}
          <div className="sm:hidden">
            <Select 
              value={category || "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  window.location.href = "/products"
                } else {
                  window.location.href = `/products?category=${value}`
                }
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs font-medium">
                <SelectValue>{getSelectedCategoryName()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL PRODUCTS</SelectItem>
                {categories.map((cat) => (
                  <SelectItem 
                    key={cat.id} 
                    value={cat.name.toLowerCase().replace(/\s+/g, '-')}
                  >
                    {cat.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-brand font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {sortedProducts.slice(0, visibleProducts).map((product, index) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <Link href={`/products/${product.id}`} className="group">
                  <div className="relative overflow-hidden">
                    <div className="h-72 sm:h-80 lg:h-96 xl:h-[28rem] relative">
                      {/* First Image - Default */}
                      <Image
                        src={product.images && product.images[0]
                          ? (typeof product.images[0] === 'string'
                              ? getOptimizedImageUrl(product.images[0] as string)
                              : getOptimizedImageUrl((product.images[0] as { url: string }).url))
                          : "/placeholder.jpg"}
                        alt={product.name}
                        fill
                        className={`object-cover transition-all duration-300 rounded-t-lg ${
                          product.images && product.images[1] 
                            ? 'group-hover:opacity-0 group-hover:scale-105' 
                            : 'group-hover:scale-105'
                        }`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        priority={index < 6}
                        loading={index < 6 ? "eager" : "lazy"}
                        quality={90}
                        onError={(e) => {
                          console.error('Product image failed to load:', product.images?.[0]);
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
                      />
                      
                      {/* Second Image - Shows on Hover */}
                      {product.images && product.images[1] && (
                        <Image
                          src={typeof product.images[1] === 'string'
                            ? getOptimizedImageUrl(product.images[1] as string)
                            : getOptimizedImageUrl((product.images[1] as { url: string }).url)}
                          alt={`${product.name} - alternate view`}
                          fill
                          className="object-cover transition-all duration-300 rounded-t-lg opacity-0 group-hover:opacity-100 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          priority={index < 4}
                          loading={index < 4 ? "eager" : "lazy"}
                          quality={90}
                          onError={(e) => {
                            console.error('Product second image failed to load:', product.images?.[1]);
                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
                          }}
                        />
                      )}
                    
                      {product.stock > 0 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            openSizePopup(product)
                          }}
                          className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group-hover:bg-white"
                          aria-label="Add to cart"
                        >
                          <ShoppingCart className="h-5 w-5 text-primary-brand" />
                        </button>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-primary-brand mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-primary-brand">{formatPrice(product.price)}</span>
                      </div>
                      {product.stock === 0 && (
                        <p className="text-red-500 text-sm mt-1">Out of Stock</p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleProducts < filteredProducts.length && (
            <div className="text-center">
              <Button onClick={loadMore} variant="outline" className="px-8 py-2 bg-transparent">
                Load More Products ({filteredProducts.length - visibleProducts} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Size Selection Popup */}
      {sizePopupOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={popupRef} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                <Image
                  src={selectedProduct.images && selectedProduct.images[0] 
                    ? (typeof selectedProduct.images[0] === 'string' ? selectedProduct.images[0] : selectedProduct.images[0].url)
                    : "/placeholder.svg"
                  }
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-primary-brand font-medium">{formatPrice(selectedProduct.price)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Select Size</h4>
              <div className="flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
                  // Check if size is available - only if sizeStock exists and > 0
                  const isAvailable = selectedProduct.sizeStock && selectedProduct.sizeStock[size] !== undefined && selectedProduct.sizeStock[size] > 0;
                  
                  // Get stock count only if size is available
                  const stockCount = isAvailable ? (selectedProduct.sizeStock?.[size] || 0) : 0;


                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`w-12 h-12 rounded-lg border-2 font-medium transition-colors relative ${
                        selectedSize === size
                          ? "border-primary-brand bg-primary-brand text-white"
                          : isAvailable
                          ? "border-gray-300 text-gray-700 hover:border-primary-brand/50 hover:bg-gray-50"
                          : "border-red-200 bg-red-50 text-red-400 cursor-not-allowed"
                      }`}
                      title={isAvailable ? `${stockCount} in stock` : "Out of stock"}
                    >
                      {size}
                      {isAvailable && stockCount > 0 && stockCount <= 2 && (
                        <span className="absolute -top-2 -right-1 bg-primary-brand text-white text-xs rounded-full px-1 py-0.5 font-medium">
                          {stockCount} left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!selectedProduct || (selectedProduct.sizeStock && selectedProduct.sizeStock[selectedSize] !== undefined ? selectedProduct.sizeStock[selectedSize] <= 0 : selectedProduct.stock <= 0)}
                className="flex-1 bg-primary-brand hover:bg-primary-brand/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {!selectedProduct || (selectedProduct.sizeStock && selectedProduct.sizeStock[selectedSize] !== undefined ? selectedProduct.sizeStock[selectedSize] <= 0 : selectedProduct.stock <= 0) 
                  ? "Out of Stock" 
                  : "Add to Cart"
                }
              </Button>
              <Button
                onClick={() => setSizePopupOpen(false)}
                variant="outline"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}