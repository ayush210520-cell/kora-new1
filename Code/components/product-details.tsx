"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {  Share2, BarChart3, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "./auth-modal"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"






interface Product {
  id: string
  name: string
  price: string
  originalPrice?: string
  description: string
  images: string[]
  sizes: string[]
  colors?: string[]
  material?: string
  inStock?: boolean
  sizeStock?: { [key: string]: number }
  stock?: number
}

interface ProductDetailsProps {
  product: Product
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { toast } = useToast()

  const [showSizeError, setShowSizeError] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  const { isAuthenticated } = useAuth()
  
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [showZoomModal, setShowZoomModal] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  // Removed imageLoading state for instant display
  const mainImageRef = useRef<HTMLDivElement>(null)
  const zoomImageRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()

  // Touch/swipe functionality for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const { images, colors = [], material = "Premium Fabric", inStock = true } = product

  // Optimize images - prioritize S3/CloudFront for best performance
  const getOptimizedImageUrl = useCallback((src: string, isThumbnail = false) => {
    if (!src) return "/placeholder.svg"
    try {
      // S3/CloudFront optimization - use CloudFront URLs directly for best performance
      if (src.includes('cloudfront.net') || (src.includes('.s3.') && src.includes('.amazonaws.com'))) {
        // For CloudFront URLs, return directly - CloudFront handles optimization
        if (src.includes('cloudfront.net')) {
          return src; // Use CloudFront URL directly for better performance and CDN caching
        }
        
        // For direct S3 URLs, convert to CloudFront for better performance
        if (src.includes('korakagazindia.s3.ap-south-1.amazonaws.com')) {
          return src.replace('korakagazindia.s3.ap-south-1.amazonaws.com', 'd22mx6u12sujnm.cloudfront.net');
        }
        
        // For any other S3 URL, return as-is
        return src;
      }
      
      // Cloudinary fallback - maintain high quality
      if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
        const size = isThumbnail ? 'w_300,h_450' : 'w_1200,h_1800'
        return src.replace('/upload/', `/upload/${size},c_fill,f_auto,q_auto:best/`)
      }
      
      return src
    } catch {
      return "/placeholder.svg"
    }
  }, [])

  // Preload all images for faster switching
  useEffect(() => {
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        const img = new window.Image()
        img.src = getOptimizedImageUrl(image, index > 0) // Thumbnails for non-first images
      })
    }
  }, [images, getOptimizedImageUrl])
  
  // Calculate if selected size is in stock
  const isSelectedSizeInStock = selectedSize ? 
    (product.sizeStock && product.sizeStock[selectedSize] !== undefined && product.sizeStock[selectedSize] > 0) : 
    false

  // Handle scroll-based image highlighting for desktop
  useEffect(() => {
    const handleScroll = () => {
      if (!mainImageRef.current) return

      const container = mainImageRef.current
      const imageElements = container.querySelectorAll("[data-image-index]")
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.top + containerRect.height / 2

      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY

      imageElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect()
        const elementCenter = rect.top + rect.height / 2
        const distance = Math.abs(elementCenter - containerCenter)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      setActiveImageIndex(closestIndex)
    }

    const container = mainImageRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Handle zoom functionality with zoom-to-point
  const handleZoom = (delta: number, event?: React.WheelEvent) => {
    setZoomLevel(prev => {
      const newZoom = Math.max(1, Math.min(5, prev + delta * 0.2)) // Increased zoom step for better control, max 500%
      
      // If zooming in and we have a mouse position, zoom to that point
      if (event && delta > 0 && newZoom > prev && event.currentTarget) {
        try {
          const rect = event.currentTarget.getBoundingClientRect()
          const centerX = rect.width / 2
          const centerY = rect.height / 2
          const mouseX = event.clientX - rect.left
          const mouseY = event.clientY - rect.top
          
          // Calculate the offset to zoom to the mouse position
          const offsetX = (mouseX - centerX) * (newZoom - prev) / newZoom
          const offsetY = (mouseY - centerY) * (newZoom - prev) / newZoom
          
          setPanOffset(prevOffset => ({
            x: prevOffset.x + offsetX,
            y: prevOffset.y + offsetY
          }))
        } catch (error) {
          console.warn('Error calculating zoom offset:', error)
          // If there's an error, just zoom to center
        }
      }
      // If zooming out, reset pan to center
      else if (delta < 0 && newZoom === 1) {
        setPanOffset({ x: 0, y: 0 })
      }
      
      return newZoom
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    // If not dragging and zoom level is 1, zoom in to click point
    if (!isDragging && zoomLevel === 1 && e.currentTarget) {
      try {
        const rect = e.currentTarget.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        // Calculate offset to zoom to click point
        const offsetX = (mouseX - centerX) * 0.5 // 50% of the zoom difference
        const offsetY = (mouseY - centerY) * 0.5
        
        setZoomLevel(1.5) // Zoom to 1.5x
        setPanOffset({ x: offsetX, y: offsetY })
      } catch (error) {
        console.warn('Error calculating click zoom offset:', error)
        // If there's an error, just zoom to center
        setZoomLevel(1.5)
        setPanOffset({ x: 0, y: 0 })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    // If Ctrl/Cmd key is held down, always zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        handleZoom(1, e) // Zoom in to mouse position
      } else {
        handleZoom(-1, e) // Zoom out
      }
    }
    // If zoomed in and no Ctrl/Cmd, use scroll to pan the image
    else if (zoomLevel > 1) {
      e.preventDefault()
      
      // Use scroll to pan the image when zoomed in
      const panSpeed = 10 // Reduced speed for better control
      const deltaY = e.deltaY || 0
      
      // Calculate boundary limits based on zoom level
      const maxOffset = 150 * (zoomLevel - 1) // More reasonable boundary
      
      setPanOffset(prevOffset => {
        const newY = Math.max(-maxOffset, Math.min(maxOffset, prevOffset.y - deltaY * panSpeed))
        
        return {
          x: prevOffset.x, // Keep X position stable
          y: newY
        }
      })
    }
    // If not zoomed and no Ctrl/Cmd, allow normal scrolling
  }

  const resetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  // Handle keyboard navigation for zoom modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showZoomModal) return

      switch (event.key) {
        case 'Escape':
          setShowZoomModal(false)
          resetZoom()
          break
        case 'ArrowLeft':
          if (images.length > 1) {
            setActiveImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
          }
          break
        case 'ArrowRight':
          if (images.length > 1) {
            setActiveImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
          }
          break
        case '+':
        case '=':
          handleZoom(1)
          break
        case '-':
          handleZoom(-1)
          break
        case '0':
          resetZoom()
          break
      }
    }

    if (showZoomModal) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showZoomModal, images.length, zoomLevel])

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index)
    if (mainImageRef.current) {
      const imageElement = mainImageRef.current.querySelector(`[data-image-index="${index}"]`)
      if (imageElement) {
        imageElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  // Mobile navigation functions
  const goToPrevious = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const goToNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  
  const handleAddToCart = async (redirectToCart = false) => {
    if (!selectedSize) {
      setShowSizeError(true)
      // Hide error after 3 seconds
      setTimeout(() => setShowSizeError(false), 3000)
      return
    }
    
    // Check if user is authenticated for BUY IT NOW
    if (redirectToCart && !isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
  
    setShowSizeError(false) // Hide error if size is selected
  
    if (redirectToCart) {
      setIsBuyingNow(true)
    } else {
      setIsAddingToCart(true)
    }
  
    addToCart({
      id: product.id, // This should be the valid CUID from backend
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize,
      slug: product.id,
    })
  
    setTimeout(() => {
      setIsAddingToCart(false)
      setIsBuyingNow(false)
  
      if (redirectToCart) {
        router.push("/cart")
      }
    }, 1000)
  }
  
  // const handleAddToCart = async () => {
  //   if (!selectedSize) {
  //     alert("Please select a size")
  //     return
  //   }

  //   setIsAddingToCart(true)

  //   // Add item to cart
  //   addToCart({
  //     id: product.id,
  //     name: product.name,
  //     price: product.price,
  //     image: product.images[0],
  //     size: selectedSize,
  //     slug: product.id,
  //   })

  //   // Simulate loading
  //   setTimeout(() => {
  //     setIsAddingToCart(false)
  //   }, 1000)
  // }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1))

  // Share functions
  const handleShare = () => {
    const currentUrl = window.location.href
    setShareLink(currentUrl)
    setShowShareModal(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard",
      })
    } catch (err) {
      console.error('Failed to copy: ', err)
      toast({
        title: "Failed to copy",
        description: "Please try copying manually",
        variant: "destructive",
      })
    }
  }

  const shareOnSocial = (platform: string) => {
    const url = encodeURIComponent(shareLink)
    const text = encodeURIComponent(`Check out this amazing product: ${product.name}`)
    
    let shareUrl = ''
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop: Thumbnails */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-[140px] h-fit space-y-2">
              {images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "w-full aspect-square relative overflow-hidden rounded-md border-2 transition-all duration-200 bg-white ",
                  activeImageIndex === index
                    ? "border-primary-brand ring-2 ring-primary-brand/20"
                    : "border-gray-200 hover:border-gray-300",
                )}
                style={{ zIndex: 10 }}
              >
                <Image
                  src={getOptimizedImageUrl(image, true) || "/placeholder.svg"}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  quality={75}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Horizontal Swipeable Images */}
        <div className="lg:hidden col-span-1">
          <div className="relative mb-6">
            {/* Main Image Display */}
            <div 
              className="relative rounded-lg overflow-hidden bg-white"
              style={{ aspectRatio: '2/3' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={getOptimizedImageUrl(images[activeImageIndex]) || "/placeholder.svg"}
                alt={`${product.name} view ${activeImageIndex + 1}`}
                fill
                className="object-contain cursor-zoom-in"
                sizes="100vw"
                priority={true}
                quality={90}
                loading="eager"
                onClick={() => {
                  setShowZoomModal(true)
                }}
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-brand hover:bg-white transition-all duration-200 shadow-lg"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-brand hover:bg-white transition-all duration-200 shadow-lg"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            
            {/* Image Indicator Dots */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={cn(
                      "transition-all duration-200",
                      activeImageIndex === index
                        ? "w-8 h-2 bg-primary-brand rounded-full"
                        : "w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Main Images */}
        <div className="hidden lg:block lg:col-span-7">
          <div
            ref={mainImageRef}
            className="h-[600px] overflow-y-auto space-y-4 pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {images.map((image, index) => (
              <div
                key={index}
                data-image-index={index}
                className="relative rounded-lg overflow-hidden bg-white"
                style={{ aspectRatio: '2/3' }}
              >
                <Image
                  src={getOptimizedImageUrl(image) || "/placeholder.svg"}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-contain cursor-zoom-in"
                  sizes="(max-width: 1024px) 100vw, 600px"
                  quality={95}
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  onClick={() => {
                    setActiveImageIndex(index)
                    setShowZoomModal(true)
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info - Matching the reference design */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[140px] lg:h-fit space-y-6">
            {/* Breadcrumb */}
            <nav className="text-sm  text-primary-brand ">
              <Link href="/" className="hover:text-gray-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/products" className="hover:text-primary-brand">
                All Products
              </Link>
              <span className="mx-2">/</span>
              <span className=" text-primary-brand">{product.name}</span>
            </nav>

            {/* Product Title */}
            <div>
              <h1 className="text-xl font-normal text-primary-brand mb-4">{product.name}</h1>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-primary-brand">₹{product.price}</span>
                <button 
                  onClick={handleShare}
                  className="ml-auto p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 group"
                  title="Share this product"
                >
                  <Share2 className="h-4 w-4 text-primary-brand group-hover:text-gray-700" />
                </button>
              </div>

              {product.originalPrice && (
                <div className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm">
                  {product.originalPrice} | 30% off from July 2, 6pm
                </div>
              )}
            </div>

            {/* Color */}
            {colors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-primary-brand">Color:</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">{colors[0]}</span>
              </div>
            )}

            {/* Size Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-primary-brand">Size:</span>
                <button 
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1 text-sm text-primary-brand hover:text-gray-900 underline"
                >
                  <BarChart3 className="h-4 w-4" />
                  SIZE GUIDE
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
                  // Check if size is available - only if sizeStock exists and > 0
                  const isAvailable = product.sizeStock && product.sizeStock[size] !== undefined && product.sizeStock[size] > 0;
                  
                  // Get stock count only if size is available
                  const stockCount = isAvailable ? (product.sizeStock?.[size] || 0) : 0;

                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={cn(
                        "py-2 px-3 border text-center text-sm font-medium transition-colors min-w-[50px] relative",
                        selectedSize === size
                          ? "border-gray-900 bg-gray-900 text-white"
                          : isAvailable
                          ? "border-gray-300 text-primary-brand hover:border-gray-400 hover:bg-gray-50"
                          : "border-red-200 bg-red-50 text-red-400 cursor-not-allowed",
                      )}
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
              
              {/* Size Selection Error Message - Only shows when button is clicked without size */}
              {showSizeError && (
                <p className="text-red-500 text-sm font-medium">Please select a size first</p>
              )}
            </div>


            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <Button
                className="w-full bg-primary-brand text-white py-3 text-base font-medium hover:bg-primary-brand/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedSize || !isSelectedSizeInStock || isAddingToCart}
                onClick={() => handleAddToCart(false)} // 🔁 Only add to cart
              >
                {isAddingToCart ? "ADDING..." : !selectedSize ? "SELECT SIZE" : !isSelectedSizeInStock ? "OUT OF STOCK" : "ADD TO BAG"}
              </Button>

              <Button
                className="w-full bg-primary-brand text-white py-3 text-base font-medium hover:bg-primary-brand/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!selectedSize || !isSelectedSizeInStock || isBuyingNow}
                onClick={() => handleAddToCart(true)} // ✅ Add + redirect
              >
                {isBuyingNow ? "PROCESSING..." : !selectedSize ? "SELECT SIZE" : !isSelectedSizeInStock ? "OUT OF STOCK" : "BUY IT NOW"}
              </Button>
            </div>

            

            {/* Product Description */}
            <div className="border-t pt-6">
              <button 
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center justify-between w-full text-left mb-3 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-brand rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-primary-brand font-semibold text-lg">Product Description</p>
                </div>
                <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <svg 
                    className={`w-5 h-5 text-primary-brand transition-transform duration-300 ${showDescription ? 'rotate-45' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
              {showDescription && (
                <div className="bg-gray-50 p-4 rounded-lg animate-in slide-in-from-top-2 duration-200">
                  <div className="text-primary-brand leading-relaxed text-sm space-y-1">
                    {product.description.split('\n').map((line, lineIndex) => (
                      <div key={lineIndex} className="leading-6">
                        {line.split(/(\*\*[^*\n]+\*\*)/g).map((part, partIndex) => {
                          if (part.match(/^\*\*[^*\n]+\*\*$/)) {
                            const text = part.slice(2, -2)
                            console.log('Found bold text:', text)
                            return (
                              <strong 
                                key={partIndex} 
                                className="font-extrabold text-primary-brand"
                                style={{ fontWeight: '900' }}
                              >
                                {text}
                              </strong>
                            )
                          }
                          return <span key={partIndex}>{part}</span>
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
    
          </div>
        </div>
      </div>
      
      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSizeGuide(false)}
        >
          {/* Backdrop with animation */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
          
          {/* Modal with entrance animation */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with simple theme color - Fixed position */}
            <div className="bg-primary-brand p-4 sm:p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">Size Guide</h2>
                </div>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 group"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Size Chart Table with enhanced styling */}
              <div className="animate-in slide-in-from-top-4 duration-500 delay-200">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-brand rounded-full"></div>
                  Size Chart
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full min-w-[500px]">
                    <thead>
                                              <tr className="bg-gray-50">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 border-b border-gray-200 text-sm sm:text-base">Size</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 border-b border-gray-200 text-sm sm:text-base">BUST</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 border-b border-gray-200 text-sm sm:text-base">WAIST</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-900 border-b border-gray-200 text-sm sm:text-base">HIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { size: "XS (Extra Small)", bust: "32", waist: "34", hip: "38" },
                        { size: "S (Small)", bust: "34", waist: "36", hip: "40" },
                        { size: "M (Medium)", bust: "36", waist: "38", hip: "42" },
                        { size: "L (Large)", bust: "38", waist: "40", hip: "44" },
                        { size: "XL (Extra Large)", bust: "40", waist: "42", hip: "46" },
                        { size: "XXL (Double Extra Large)", bust: "42", waist: "44", hip: "48" }
                      ].map((row, index) => (
                        <tr 
                          key={row.size}
                          className={`group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:z-10 relative ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 border-r border-gray-100 group-hover:text-primary-brand transition-colors duration-300 text-sm sm:text-base">
                            {row.size}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-center group-hover:text-primary-brand transition-colors duration-300 font-medium text-sm sm:text-base">
                            {row.bust}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-center group-hover:text-primary-brand transition-colors duration-300 font-medium text-sm sm:text-base">
                            {row.waist}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-center group-hover:text-primary-brand transition-colors duration-300 font-medium text-sm sm:text-base">
                            {row.hip}
                          </td>
                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 bg-primary-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"></div>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explanatory Text with enhanced styling */}
              <div className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-brand/20 rounded-full mt-1 group-hover:bg-primary-brand/30 transition-colors duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">Fit Information</h4>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Our products come in different fits- regular & relaxed, as mentioned in the product description. 
                        The size chart above is a standard body measurement guide to help you choose your size. 
                        Depending on the design, the fit may vary slightly- giving each piece its own unique comfort and style.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="animate-in slide-in-from-bottom-4 duration-500 delay-400">
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="w-full bg-primary-brand text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-brand/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-base sm:text-lg"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          {/* Backdrop with animation */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
          
          {/* Modal with entrance animation */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with simple theme color */}
            <div className="bg-primary-brand p-4 sm:p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Share Product</h2>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 group"
                >
                  <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600">Share this amazing product with friends!</p>
              </div>

              {/* Social Media Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => shareOnSocial('whatsapp')}
                  className="flex items-center justify-center gap-2 p-3 bg-primary-brand text-white rounded-xl hover:bg-primary-brand/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </button>

                <button
                  onClick={() => shareOnSocial('telegram')}
                  className="flex items-center justify-center gap-2 p-3 bg-primary-brand text-white rounded-xl hover:bg-primary-brand/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.911.177-.184 3.512-3.2 3.583-3.48.008-.027.008-.14-.056-.2s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </button>

                <button
                  onClick={() => shareOnSocial('facebook')}
                  className="flex items-center justify-center gap-2 p-3 bg-primary-brand text-white rounded-xl hover:bg-primary-brand/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>

                <button
                  onClick={() => shareOnSocial('twitter')}
                  className="flex items-center justify-center gap-2 p-3 bg-primary-brand text-white rounded-xl hover:bg-primary-brand/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </button>
              </div>

              {/* Copy Link Section */}
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Product Link</p>
                  <p className="text-sm text-gray-700 break-all">{shareLink}</p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-primary-brand text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-brand/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  Copy Link
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flipkart-style Zoom Modal */}
          {showZoomModal && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowZoomModal(false)
              resetZoom()
            }}
            className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
            <button
              onClick={() => handleZoom(1)}
              className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-primary-brand hover:bg-white transition-all duration-200 shadow"
            >
              <span className="text-lg font-bold">+</span>
            </button>
            <button
              onClick={() => handleZoom(-1)}
              className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-primary-brand hover:bg-white transition-all duration-200 shadow"
            >
              <span className="text-lg font-bold">−</span>
            </button>
            <button
              onClick={resetZoom}
              className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-primary-brand hover:bg-white transition-all duration-200 text-xs shadow"
            >
              1:1
            </button>
          </div>


          {/* Previous/Next Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => {
                  setActiveImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-primary-brand hover:bg-white hover:scale-110 transition-all duration-200 border-2 border-white/60 shadow-lg"
                title="Previous Image (←)"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              <button
                onClick={() => {
                  setActiveImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/90 rounded-full flex items-center justify-center text-primary-brand hover:bg-white hover:scale-110 transition-all duration-200 border-2 border-white/60 shadow-lg"
                title="Next Image (→)"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Zoomable Image Container */}
          <div 
            ref={zoomImageRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleImageClick}
            style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
          >
            <div
              className="relative transition-all duration-200 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: 'center center'
              }}
            >
              <Image
                src={getOptimizedImageUrl(images[activeImageIndex]) || "/placeholder.svg"}
                alt={`${product.name} zoom view ${activeImageIndex + 1}`}
                width={800}
                height={800}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                priority
                quality={95}
                key={activeImageIndex} // Force re-render when image changes
              />
            </div>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
              Image {activeImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveImageIndex(index)
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    activeImageIndex === index
                      ? "border-white ring-2 ring-white/50"
                      : "border-white/30 hover:border-white/60"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Instructions - Hidden on Mobile */}
          <div className="hidden md:block absolute bottom-6 right-6 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs max-w-[220px]">
            <div className="font-semibold mb-1">Controls:</div>
            <div>🖱️ Scroll to zoom in/out</div>
            <div>🖱️ Drag to pan around</div>
            <div>⌨️ +/- buttons or +/- keys to zoom</div>
            <div>⌨️ 0 key to reset zoom</div>
            <div>⌨️ ← → arrow keys to change images</div>
            <div>🖱️ Click thumbnails to jump to image</div>
            <div>🖱️ Click &lt; &gt; arrows to navigate</div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
