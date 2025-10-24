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
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    // Ensure Vercel URL has proper protocol
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
  }
  
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://korakagazindia.com'
}

// Safe domain getter for build time
export const getSafeDomain = () => {
  try {
    return getDomain()
  } catch (error) {
    console.warn('Error getting domain, using fallback:', error)
    return 'https://korakagazindia.com'
  }
}

// Validate and format URL
const validateUrl = (url: string): string => {
  try {
    // If it's already a valid URL, return as is
    new URL(url)
    return url
  } catch {
    // If it's not a valid URL, try to fix it
    if (!url.startsWith('http')) {
      return `https://${url}`
    }
    return url
  }
}

// Get base URL for the current domain
export const getBaseUrl = () => {
  const domain = getDomain()
  return validateUrl(domain)
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
