"use client"

import Link from "next/link"
import { Instagram, Facebook } from "lucide-react"
import { getContactEmail } from "@/lib/config"

export default function SiteFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 sm:py-12 lg:py-16">
      <div className="w-full px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16 items-start justify-between">
          
          {/* Logo Section - Bigger Logo Only */}
          <div className="space-y-4 text-center">
            <div className="h-32 sm:h-36 lg:h-40 flex items-center justify-center">
              <img
                src="/logofinal.png"
                alt="KORAKAGAZ Logo"
                className="h-full object-contain"
              />
            </div>
          </div>

          {/* CONTACT US */}
          <div className="space-y-4 text-left">
            <h3 className="text-xl font-bold text-primary-brand">CONTACT US</h3>
            <ul className="space-y-3 text-base text-primary-brand">
              <li>
                <a href={`mailto:${getContactEmail()}`} className="hover:text-primary-brand transition-colors hover:underline">
                  {getContactEmail()}
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/916261911729" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-brand transition-colors hover:underline"
                >
                  +91 6261-911729
                </a>
              </li>
              <li className="text-base leading-relaxed">
                24, Readymade Complex, Pardesipura, Indore, Madhya Pradesh, 452006, India
              </li>
            </ul>
          </div>

          {/* ABOUT US */}
          <div className="space-y-4 text-left">
            <h3 className="text-xl font-bold text-primary-brand">ABOUT US</h3>
            <ul className="space-y-3 text-base text-primary-brand">
              <li>
                <Link href="/our-story" className="hover:text-primary-brand transition-colors hover:underline">
                  Our story
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary-brand transition-colors hover:underline">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-brand transition-colors hover:underline">
                  Terms of service
                </Link>
              </li>
            </ul>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-3">
              <Link
                href="https://www.instagram.com/korakagaz.india?igsh=MTJ2aHQ1cmUwM2Jkag=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-brand rounded-full flex items-center justify-center text-white hover:bg-primary-brand/90 transition-all duration-300 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.facebook.com/profile.php?id=61581472329722&sk=about_contact_and_basic_info"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-brand rounded-full flex items-center justify-center text-white hover:bg-primary-brand/90 transition-all duration-300 hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </Link>

            </div>
          </div>

          {/* HELP */}
          <div className="space-y-4 text-left">
            <h3 className="text-xl font-bold text-primary-brand">HELP</h3>
            <ul className="space-y-3 text-base text-primary-brand">
              <li>
                <Link href="/shipping" className="hover:text-primary-brand transition-colors hover:underline">
                  Shipping and delivery policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary-brand transition-colors hover:underline">
                  Return policy
                </Link>
              </li>

              <li>
                <Link href="/privacy" className="hover:text-primary-brand transition-colors hover:underline">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-brand transition-colors hover:underline">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  )
}
