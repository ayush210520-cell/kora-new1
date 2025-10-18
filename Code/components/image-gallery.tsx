"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { DynamicImage } from "@/hooks/use-dynamic-images"

// Fallback gallery images if no dynamic images are available
const fallbackGalleryImages = [
  {
    id: 1,
    src: "/SS2566.jpg", // Keep local for now (too large for Cloudinary free tier)
    alt: "Gold Statement Earrings",
    price: "₹14,500",
    slug: "gold-statement-earrings",
  },
  {
    id: 2,
    src: "/SS3081.jpg", // Keep local for now (too large for Cloudinary free tier)
    alt: "Orange Silk Top",
    price: "₹23,500",
    slug: "orange-silk-top",
  },
  {
    id: 3,
    src: "/BLACK.JPG", // Keep local for now (too large for Cloudinary free tier)
    alt: "Black Kurti Set",
    price: "₹26,000",
    slug: "elegant-Kurti-set",
  },
  {
    id: 4,
    src: "https://res.cloudinary.com/diamvptiv/image/upload/w_800,h_1200,c_fill,f_auto,q_auto:good/v1759752880/ecommerce-static/gulaab2.jpg",
    alt: "Designer Kurti",
    price: "₹31,000",
    slug: "designer-kurti",
  },
  {
    id: 5,
    src: "https://res.cloudinary.com/diamvptiv/image/upload/w_800,h_1200,c_fill,f_auto,q_auto:good/v1759752893/ecommerce-static/morni3.jpg",
    alt: "Traditional Anarkali",
    price: "₹36,500",
    slug: "traditional-anarkali",
  },
  {
    id: 6,
    src: "/YELLO.JPG", // Keep local for now (too large for Cloudinary free tier)
    alt: "Modern Palazzo Set",
    price: "₹42,000",
    slug: "modern-palazzo-set",
  },
  {
    id: 7,
    src: "https://res.cloudinary.com/diamvptiv/image/upload/w_800,h_1200,c_fill,f_auto,q_auto:good/v1759752914/ecommerce-static/SS7015.jpg",
    alt: "Premium Coord Set",
    price: "₹38,500",
    slug: "premium-coord-set",
  },
  {
    id: 8,
    src: "https://res.cloudinary.com/diamvptiv/image/upload/w_800,h_1200,c_fill,f_auto,q_auto:good/v1759752917/ecommerce-static/SS7010.jpg",
    alt: "Luxury Kurti",
    price: "₹45,000",
    slug: "luxury-kurti",
  },
  {
    id: 9,
    src: "https://res.cloudinary.com/diamvptiv/image/upload/w_800,h_1200,c_fill,f_auto,q_auto:good/v1759752919/ecommerce-static/SS7041.jpg",
    alt: "Exclusive Anarkali",
    price: "₹52,000",
    slug: "exclusive-anarkali",
  },
  {
    id: 10,
    src: "https://res.cloudinary.com/diamvptiv/image/upload/w_800,h_1200,c_fill,f_auto,q_auto:good/v1759752920/ecommerce-static/SS6960.jpg",
    alt: "Artistic Top",
    price: "₹28,500",
    slug: "artistic-top",
  },
]

interface ImageGalleryProps {
  initialImages?: DynamicImage[]
}

function ImageGallery({ initialImages = [] }: ImageGalleryProps) {
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set())
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  
  // Use server-fetched images (fast like products page)
  const galleryImages = initialImages
    .filter(img => img.position.startsWith('gallery-'))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img, index) => ({
      id: img.id,
      src: img.imageUrl,
      alt: img.altText || img.title,
      price: img.title, // Using title as price for now
      slug: img.linkUrl || '/products',
      linkUrl: img.linkUrl || '/products'
    }))
  
  // Use dynamic images if available, otherwise fallback (instant, no loading state)
  const images = galleryImages.length > 0 ? galleryImages : fallbackGalleryImages

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = entry.target.getAttribute("data-index")
          if (index && entry.isIntersecting) {
            setVisibleImages((prev) => new Set([...prev, Number.parseInt(index)]))
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    )

    const imageElements = document.querySelectorAll("[data-index]")
    imageElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [isClient])

  const handleImageClick = (image: any, index: number) => {
    // First 2 images (0, 1): Category links
    // Next 4 images (2-5): Product links
    
    if (!image.linkUrl) {
      router.push('/products')
      return
    }
    
    // Check if it's a category link or product link based on linkUrl format
    // Category: /products?category=... or just category name
    // Product: /products/product-id
    router.push(image.linkUrl)
  }

  if (!isClient) {
    return (
      <section className="w-full ">
        {/* Mobile: 2 photos per row */}
        <div className="block sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={image.id} className="relative group overflow-hidden aspect-[3/4]">
                <div 
                  className="block w-full h-full cursor-pointer"
                  onClick={index < 2 ? () => handleCategoryClick(index === 0 ? 'kurti-set' : 'short-kurti') : () => handleImageClick(image.linkUrl)}
                  title={index < 2 ? (index === 0 ? "Click to view Kurti Set category" : "Click to view Short Kurti category") : "Click to view all products"}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    style={{ objectFit: "cover" }}
                        quality={95}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 px-4 py-2 rounded-sm">
                      <p className="text-primary-brand font-medium text-sm">Shop Now</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet: 2x3 grid */}
        <div className="hidden sm:block lg:hidden">
          <div className="grid grid-cols-2 gap-0">
            {images.map((image, index) => (
              <div key={image.id} className="relative group overflow-hidden aspect-[3/4]">
                <div 
                  className="block w-full h-full cursor-pointer"
                  onClick={index < 2 ? () => handleCategoryClick(index === 0 ? 'kurti-set' : 'short-kurti') : () => handleImageClick(image.linkUrl)}
                  title={index < 2 ? (index === 0 ? "Click to view Kurti Set category" : "Click to view Short Kurti category") : "Click to view all products"}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    style={{ objectFit: "cover" }}
                        quality={95}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 px-6 py-3 rounded-sm">
                      <p className="text-primary-brand font-medium text-base">Shop Now</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden lg:block">
          {/* First Row: 2 photos side by side */}
          <div className="flex w-full h-screen">
            {images.slice(0, 2).map((image, index) => (
              <div key={image.id} className="relative group overflow-hidden" style={{ width: "50%" }}>
                <div 
                  className="block w-full h-full cursor-pointer"
                  onClick={() => handleImageClick(image.linkUrl)}
                  title="Click to view all products"
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    style={{ objectFit: "cover" }}
                        quality={95}
                    loading={index < 1 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(max-width: 1536px) 50vw, 33vw"
                    className="transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                  {/* Shop Now overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 px-6 py-3 rounded-sm">
                      <p className="text-primary-brand font-medium text-lg">Shop Now</p>
                    </div>
                  </div>
                </div>
                {index === 0 && <div className="absolute top-0 right-0 w-px h-full bg-white/50" />}
              </div>
            ))}
          </div>

          {/* Second Row: 4 photos side by side */}
          <div className="flex w-full h-screen">
            {images.slice(2, 6).map((image, index) => (
              <div key={image.id} className="relative group overflow-hidden" style={{ width: "25%" }}>
                <div 
                  className="block w-full h-full cursor-pointer"
                  onClick={() => handleImageClick(image.linkUrl)}
                  title="Click to view all products"
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    style={{ objectFit: "cover" }}
                        quality={95}
                    loading={index < 1 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(max-width: 1536px) 25vw, 20vw"
                    className="transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

                  {/* "Shop Now" overlay at bottom center */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white/90 px-6 py-3 rounded-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-primary-brand font-medium text-lg">Shop Now</p>
                    </div>
                  </div>
                </div>
                {index < 3 && <div className="absolute top-0 right-0 w-px h-full bg-white/50" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      {/* Mobile: 2 photos per row - Show only 6 images like desktop */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          {images.slice(0, 6).map((image, index) => (
            <div
              key={image.id}
              data-index={index}
              className={`relative group overflow-hidden aspect-[3/4] transition-all duration-1000 ease-out ${
                visibleImages.has(index) ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div 
                className="block w-full h-full cursor-pointer"
                onClick={() => handleImageClick(image, index)}
                title={index < 2 ? "Click to view category" : "Click to view product details"}
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  quality={100}
                  className="transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 px-4 py-2 rounded-sm">
                    <p className="text-primary-brand font-medium text-sm">Shop Now</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tablet: 2x3 grid */}
      <div className="hidden sm:block lg:hidden">
        <div className="grid grid-cols-2 gap-0">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              data-index={index}
              className={`relative group overflow-hidden aspect-[3/4] transition-all duration-1000 ease-out ${
                visibleImages.has(index) ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div 
                className="block w-full h-full cursor-pointer"
                onClick={() => handleImageClick(image, index)}
                title={index < 2 ? "Click to view category" : "Click to view product details"}
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  quality={100}
                  className="transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 px-6 py-3 rounded-sm">
                    <p className="text-primary-brand font-medium text-base">Shop Now</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Original layout */}
      <div className="hidden lg:block">
        {/* First Row: 2 photos centered with gap and margins */}
        <div className="flex justify-center items-center w-full h-[600px] bg-amber-900 px-8">
          <div className="flex gap-1 w-full max-w-3xl">
            {images.slice(0, 2).map((image, index) => (
              <div
                key={image.id}
                data-index={index}
                className={`relative group overflow-hidden transition-all duration-1000 ease-out ${
                  visibleImages.has(index) ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
                }`}
                style={{
                  width: "50%",
                  transitionDelay: `${index * 200}ms`,
                }}
              >
                <div 
                  className="block w-full h-[500px] cursor-pointer overflow-hidden bg-amber-900"
                  onClick={() => handleImageClick(image, index)}
                  title={index < 2 ? "Click to view category" : "Click to view product details"}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    style={{ objectFit: "contain" }}
                        quality={95}
                    className="transition-transform duration-700 "
                  />
                  <div className="absolute inset-0  transition-all duration-300" />
                  {/* Shop Now overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 px-6 py-3 rounded-sm">
                      <p className="text-primary-brand font-medium text-lg">Shop Now</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second Row: 4 photos side by side */}
        <div className="flex w-full h-[600px]">
          {images.slice(2, 6).map((image, index) => (
            <div
              key={image.id}
              data-index={index + 2}
              className={`relative group overflow-hidden transition-all duration-1000 ease-out ${
                visibleImages.has(index + 2)
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-8"
              }`}
              style={{
                width: "25%",
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <div 
                className="block w-full h-full cursor-pointer"
                onClick={handleImageClick}
                title="Click to view all products"
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  quality={100}
                  className="transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

                {/* "Shop Now" overlay at bottom center */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white/90 px-6 py-3 rounded-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-primary-brand font-medium text-lg">Shop Now</p>
                  </div>
                </div>
              </div>
              {index < 3 && <div className="absolute top-0 right-0 w-px h-full bg-white/50" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// export it in both ways so imports like
//   import ImageGallery from "@/components/image-gallery"
//   import { ImageGallery } from "@/components/image-gallery"
// are both valid.
export { ImageGallery }
export default ImageGallery
