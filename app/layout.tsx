import type React from "react"
import type { Metadata } from "next"
import { Questrial } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/contexts/cart-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { getBaseUrl, getFullUrl } from "@/lib/config"

const questrial = Questrial({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: {
    default: "KORAKAGAZ",
    template: "%s | KORAKAGAZ"
  },
  description: "Unfold your story with our contemporary collection of women’s ethnic wear — where comfort meets charm. Each piece from Korakagaz celebrates fresh beginnings through thoughtful designs, handcrafted fabrics, and timeless silhouettes.",
  icons: {
    icon: [
      { url: '/logokorabrown.png', type: 'image/png', sizes: '32x32' },
      { url: '/logokorabrown.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/logokorabrown.png',
    apple: '/logokorabrown.png',
  },
  keywords: [
    "traditional fashion",
    "party wear dresses",
    "ethnic wear",
    "indian fashion",
    "party dresses",
    "traditional dresses",
    "korakagaz",
    "fashion boutique",
    "designer wear",
    "indian clothing"
  ],
  authors: [{ name: "KORAKAGAZ Team" }],
  creator: "KORAKAGAZ",
  publisher: "KORAKAGAZ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(getBaseUrl()),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: getBaseUrl(),
    siteName: 'KORAKAGAZ',
    title: 'KORAKAGAZ',
    description: 'Unfold your story with our contemporary collection of women’s ethnic wear — where comfort meets charm. Each piece from Korakagaz celebrates fresh beginnings through thoughtful designs, handcrafted fabrics, and timeless silhouettes.',
    images: [
      {
        url: '/firstlogo.png',
        width: 512,
        height: 512,
        alt: 'KORAKAGAZ Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KORAKAGAZ',
    description: 'Unfold your story with our contemporary collection of women’s ethnic wear — where comfort meets charm. Each piece from Korakagaz celebrates fresh beginnings through thoughtful designs, handcrafted fabrics, and timeless silhouettes.',
    images: ['/firstlogo.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'rBMPbA-N2JHDqfYQ5tyyu5hhL9YecjDamupLjJFCe1w', 
    // google-site-verification=rBMPbA-N2JHDqfYQ5tyyu5hhL9YecjDamupLjJFCe1w// Add your Google Search Console verification code
  },
  category: 'fashion',
  classification: 'fashion and lifestyle',
  other: {
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'KORAKAGAZ',
    'application-name': 'KORAKAGAZ',
    'msapplication-config': '/browserconfig.xml',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon - Exact logokorabrown.png image with multiple formats */}
        <link rel="icon" href="/logokorabrown.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/logokorabrown.png" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/logokorabrown.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logokorabrown.png" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://d22mx6u12sujnm.cloudfront.net" />
        <link rel="preconnect" href="https://korakagazindia.s3.ap-south-1.amazonaws.com" />
        <link rel="preconnect" href="https://server.korakagazindia.com" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/firstlogo.png" as="image" type="image/png" fetchPriority="high" />
        <link rel="preload" href="/secondlogo.png" as="image" type="image/png" fetchPriority="high" />
        
        {/* Preload critical CSS - removed as it causes MIME type issues */}
        
        {/* Preload critical pages */}
        <link rel="prefetch" href="/products" />
        <link rel="prefetch" href="/cart" />
        
        {/* Structured Data for Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "KORAKAGAZ",
              "url": getBaseUrl(),
              "logo": getFullUrl("/firstlogo.png"),
              "description": "Premium Traditional & Party Wear Fashion",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service"
              },
              "sameAs": [
                "https://www.instagram.com/korakagaz",
                "https://www.facebook.com/korakagaz"
              ]
            })
          }}
        />
        
        {/* Additional Meta Tags for SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KORAKAGAZ" />
        <meta name="application-name" content="KORAKAGAZ" />
        
        {/* Social Media Meta Tags */}
        <meta property="og:site_name" content="KORAKAGAZ" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="KORAKAGAZ" />
        <meta property="og:description" content="Discover exclusive traditional and party wear fashion at KORAKAGAZ. Premium quality dresses, ethnic wear, and contemporary fashion for every occasion." />
        <meta property="og:url" content={getBaseUrl()} />
        <meta property="og:image" content={getFullUrl("/firstlogo.png")} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="KORAKAGAZ Logo" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KORAKAGAZ - Premium Traditional & Party Wear Fashion" />
        <meta name="twitter:description" content="Discover exclusive traditional and party wear fashion at KORAKAGAZ. Premium quality dresses, ethnic wear, and contemporary fashion for every occasion." />
        <meta name="twitter:image" content={getFullUrl("/firstlogo.png")} />
        
        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={getBaseUrl()} />
      </head>
      <body className={questrial.className}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
