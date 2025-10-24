// Configuration for API endpoints
export const config = {
  // API Base URL - use environment variable or fallback to production URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://server.korakagazindia.com',
  
  // Check if we're in production
  isProduction: process.env.NODE_ENV === 'production',
  
  // Check if we're in development
  isDevelopment: process.env.NODE_ENV === 'development',
}

// Dynamic domain configuration
export const getDomain = () => {
  // In browser environment, use current domain
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // In server environment, use environment variable or fallback
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://korakagazindia.com'
}

// Get base URL for the current domain
export const getBaseUrl = () => {
  const domain = getDomain()
  return domain
}

// Get full URL for a path
export const getFullUrl = (path: string) => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

// Contact information
export const getContactEmail = () => {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@korakagazindia.com'
}
