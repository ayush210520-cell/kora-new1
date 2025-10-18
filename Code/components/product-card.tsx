"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  price: number
  images: Array<string | { url: string; public_id: string }>
  stock: number
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getImageUrl = () => {
    if (imageError) return "/placeholder.svg"
    if (product.images && product.images[0]) {
      return typeof product.images[0] === 'string' 
        ? product.images[0] 
        : product.images[0].url
    }
    return "/placeholder.svg"
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden">
          <div className="h-72 sm:h-80 lg:h-96 xl:h-[28rem] relative">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-t-lg" />
            )}
            
            {/* First Image - Default */}
            <Image
              src={getImageUrl()}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-300 rounded-t-lg ${
                product.images && product.images[1] 
                  ? 'group-hover:opacity-0 group-hover:scale-105' 
                  : 'group-hover:scale-105'
              } ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              priority={false}
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true)
                setImageLoading(false)
              }}
            />
            
            {/* Second Image - Shows on Hover (only if it exists) */}
            {product.images && product.images[1] && (
              <Image
                src={typeof product.images[1] === 'string' ? product.images[1] : product.images[1].url}
                alt={`${product.name} - alternate view`}
                fill
                className="object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 rounded-t-lg"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={false}
                loading="lazy"
              />
            )}
          
            {product.stock > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAddToCart(product)
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
  )
}