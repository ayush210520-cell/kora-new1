/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Environment variables configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  async rewrites() {
    // In development, rewrite API calls to local backend
    if (process.env.NODE_ENV === 'development') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      console.log('🔗 API URL configured:', apiUrl)
      
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ]
    }
    
    // In production, use Next.js API routes as proxy
    return []
  },

  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/products',
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/shop/:path*',
        destination: '/products/:path*',
        permanent: true, // 301 redirect for any shop sub-pages
      },
      {
        source: '/collection',
        destination: '/products',
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/collection/:path*',
        destination: '/products/:path*',
        permanent: true, // 301 redirect for any collection sub-pages
      },
    ]
  },
  
  images: {
    unoptimized: true, // ✅ Keep disabled - large S3 images cause timeout with Next.js optimization
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/webp'], // WebP for all browsers, automatic JPEG fallback
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    disableStaticImages: false, // Allow static imports for better compatibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'server.korakagazindia.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'korakagazindia.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent-*.cdninstagram.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Production optimizations (only applied in production)
  ...(process.env.NODE_ENV === 'production' && {
    // Enable compression in production
    compress: true,
    

    
    // Security headers
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            // SEO and Performance headers
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
            // CORS headers for Safari and cross-browser compatibility
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, HEAD, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'X-Requested-With, Content-Type, Accept',
            },
          ],
        },
        // Specific headers for static assets
        {
          source: '/(.*).(jpg|jpeg|png|gif|webp|ico|svg)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
            },
            {
              key: 'Expires',
              value: 'Thu, 31 Dec 2025 23:59:59 GMT',
            },
          ],
        },
        // Headers for CSS and JS files
        {
          source: '/(.*).(css|js)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ]
    },
  }),
  

  
  // Webpack configuration for better performance
  webpack: (config, { dev, isServer }) => {
    // Optimize images in production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.images = {
        test: /\.(png|jpe?g|gif|svg|webp)$/,
        name: 'images',
        chunks: 'all',
        enforce: true,
      };
    }
    
    return config;
  },
}

export default nextConfig
