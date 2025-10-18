"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, ShoppingCart, Menu, X, Settings, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { config } from "@/lib/config"
import AuthModal from "./auth-modal"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import CartDrawer from "./cart-drawer"

interface Category {
  id: string
  name: string
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const pathname = usePathname()
  const { state } = useCart()
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  
  // No debug logging in production

  const announcementTexts = [
    "FREE SHIPPING ON ALL ORDERS ",
    "Easy Return & Exchanges",
  ]

  // Helper function to convert category name to URL slug
  const getCategorySlug = (categoryName: string) => {
    return categoryName.toLowerCase().replace(/\s+/g, '-')
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // No need for local auth state management - using auth context instead

  // Announcement text rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % announcementTexts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/products/categories`)
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Handle escape key and body overflow
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAuthModalOpen) setIsAuthModalOpen(false)
        if (isMobileMenuOpen) setIsMobileMenuOpen(false)
      }
    }
    
    if (isAuthModalOpen || isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isAuthModalOpen, isMobileMenuOpen])

  // Computed values
  const isHomePage = pathname === "/"
  const isNavbarActive = scrolled || hovered

  // Event handlers
  const handleDropdownEnter = (dropdown: string) => setActiveDropdown(dropdown)
  const handleDropdownLeave = () => setActiveDropdown(null)
  const handleAuthModalClose = () => setIsAuthModalOpen(false)
  const handleAuthModalOpen = () => setIsAuthModalOpen(true)
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  
  const handleLogout = () => {
    // Use auth context logout function
    logout()
    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      <div className="w-full fixed top-0 left-0 z-50">
        {/* Announcement Bar */}
        <div className="bg-primary-brand text-white text-center py-1 text-sm relative overflow-hidden h-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div key={currentTextIndex} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
              {announcementTexts[currentTextIndex]}
            </div>
          </div>
        </div>

        {/* Navbar */}
        <header
          className={cn(
            "transition-all duration-300",
            isNavbarActive ? "bg-white shadow-sm" : "bg-transparent"
          )}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false)
            setActiveDropdown(null)
          }}
        >
          <div className="flex items-center justify-between px-6 py-0.8">
            {/* Mobile Menu Icon */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "transition-all duration-200",
                  !isHomePage
                    ? "text-primary-brand hover:bg-primary-brand/10"
                    : isNavbarActive
                      ? "text-primary-brand hover:bg-primary-brand/10"
                      : "text-white hover:bg-white/10"
                )}
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            {/* Logo */}
            <div className="lg:flex-none flex-1 flex justify-center lg:justify-start">
              <Link
                href="/"
                className={cn(
                  "text-xl sm:text-2xl tracking-widest flex items-center gap-2 transition-colors duration-300 font-light",
                  !isHomePage ? "text-primary-brand" : isNavbarActive ? "text-primary-brand" : "text-white"
                )}
              >
                {(isNavbarActive || !isHomePage) ? (
                  <img
                    src="/firstlogo.png"
                    alt="KORAKAGAZ"
                    className="h-14 sm:h-16 md:h-20 lg:h-20 transition-all duration-300"
                  />
                ) : (
                  <img
                    src="/secondlogo.png"
                    alt="KORAKAGAZ Default"
                    className="h-14 sm:h-16 md:h-20 lg:h-20 transition-all duration-300"
                  />
                )}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-12">
              <Link
                href="/"
                prefetch={true}
                className={cn(
                  "hover:underline transition-all duration-200 uppercase text-base font-medium",
                  !isHomePage ? "text-primary-brand" : isNavbarActive ? "text-primary-brand" : "text-white"
                )}
              >
                HOME
              </Link>

              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter("products")}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className={cn(
                    "hover:underline transition-all duration-200 uppercase text-base font-medium",
                    !isHomePage ? "text-primary-brand" : isNavbarActive ? "text-primary-brand" : "text-white"
                  )}
                >
                  PRODUCTS
                </button>
                {activeDropdown === "products" && (
                  <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-lg rounded-md py-2 min-w-[200px] z-50 animate-in slide-in-from-top-2 duration-200" style={{ marginTop: '0px' }}>
                    <Link
                      href="/products"
                      className="block px-4 py-2 text-primary-brand hover:bg-primary-brand hover:text-white transition-colors uppercase text-sm"
                      prefetch={true}
                    >
                      ALL PRODUCTS
                    </Link>
                    {isLoadingCategories ? (
                      <div className="px-4 py-2 text-gray-500 text-sm">Loading categories...</div>
                    ) : (
                      categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/products?category=${getCategorySlug(category.name)}`}
                          className="block px-4 py-2 text-primary-brand hover:bg-primary-brand hover:text-white transition-colors uppercase text-sm"
                          prefetch={true}
                        >
                          {category.name.toUpperCase()}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/our-story"
                prefetch={true}
                className={cn(
                  "hover:underline transition-all duration-200 uppercase text-base font-medium",
                  !isHomePage ? "text-primary-brand" : isNavbarActive ? "text-primary-brand" : "text-white"
                )}
              >
                OUR STORY
              </Link>

              {/* Admin Panel Link - Only show for admin users */}
              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={true}
                  className={cn(
                    "hover:underline transition-all duration-200 uppercase text-sm font-medium flex items-center gap-2",
                    !isHomePage ? "text-primary-brand" : isNavbarActive ? "text-primary-brand" : "text-white"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  ADMIN
                </Link>
              )}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search Icon - Desktop Only */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "hidden lg:flex transition-all duration-200 hover:scale-110",
                  !isHomePage
                    ? "text-primary-brand hover:bg-primary-brand/10"
                    : isNavbarActive
                      ? "text-primary-brand hover:bg-primary-brand/10"
                      : "text-white hover:bg-white/10"
                )}
                onClick={() => {
                  // TODO: Implement search functionality
                  console.log("Search clicked")
                }}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Auth Button - Desktop */}
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "hidden lg:flex transition-all duration-200 text-sm font-medium uppercase",
                    !isHomePage
                      ? "text-primary-brand hover:bg-primary-brand/10"
                      : isNavbarActive
                        ? "text-primary-brand hover:bg-primary-brand/10"
                        : "text-white hover:bg-white/10"
                  )}
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  Logout
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden lg:flex transition-all duration-200 hover:scale-110",
                    !isHomePage
                      ? "text-primary-brand hover:bg-primary-brand/10"
                      : isNavbarActive
                        ? "text-primary-brand hover:bg-primary-brand/10"
                        : "text-white hover:bg-white/10"
                  )}
                  onClick={handleAuthModalOpen}
                  aria-label="Login"
                >
                  <User className="h-5 w-5" />
                </Button>
              )}

              {/* Orders Link - Only show for authenticated users */}
              {isAuthenticated && (
                <Link
                  href="/orders"
                  prefetch={true}
                  className={cn(
                    "hidden lg:flex items-center gap-2 text-sm font-medium uppercase transition-all duration-200",
                    !isHomePage
                      ? "text-primary-brand hover:text-primary-brand/80"
                      : isNavbarActive
                        ? "text-primary-brand hover:text-primary-brand/80"
                        : "text-white hover:text-white/80"
                  )}
                >
                  <Package className="h-4 w-4" />
                  ORDERS
                </Link>
              )}

              {/* Cart Drawer */}
              <CartDrawer 
                isHomePage={isHomePage}
                isNavbarActive={isNavbarActive}
              />
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            className={cn(
              "lg:hidden bg-white shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
              isMobileMenuOpen ? "max-h-15 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div
              className={cn(
                "transform transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <nav className="px-6 py-4">
                <div className="flex items-center justify-between gap-4 overflow-x-auto">
                  <Link
                    href="/"
                    prefetch={true}
                    className="text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    HOME
                  </Link>
                  <Link
                    href="/products"
                    prefetch={true}
                    className="text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ALL PRODUCTS
                  </Link>
                  <Link
                    href="/our-story"
                    prefetch={true}
                    className="text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    OUR STORY
                  </Link>



                  {/* Mobile Orders Link */}
                  {isAuthenticated && (
                    <Link
                      href="/orders"
                      prefetch={true}
                      className="text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      ORDERS
                    </Link>
                  )}



                  {/* Mobile Admin Panel Link */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      prefetch={true}
                      className="text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      ADMIN
                    </Link>
                  )}

                  {/* Mobile Auth Button */}
                  {isAuthenticated ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap"
                    >
                      Logout
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleAuthModalOpen()
                      }}
                      className="flex items-center gap-2 text-primary-brand hover:text-primary-brand/80 uppercase text-sm font-medium whitespace-nowrap"
                    >
                      <User className="h-4 w-4" />
                      <span>Login</span>
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </header>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthModalClose} />
    </>
  )
}