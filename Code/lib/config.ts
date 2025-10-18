// Configuration for API endpoints
export const config = {
  // API Base URL - use environment variable or fallback to production URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://server.korakagazindia.com',
  
  // Check if we're in production
  isProduction: process.env.NODE_ENV === 'production',
  
  // Check if we're in development
  isDevelopment: process.env.NODE_ENV === 'development',
}
