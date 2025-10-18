import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/products/',
        '/products/*',
        '/shop/',
        '/collection/',
        '/cart/',
        '/checkout/',
        '/orders/',
        '/our-story/',
        '/faq/',
        '/shipping/',
        '/returns/',
        '/terms/',
        '/privacy/',
      ],
      disallow: [
        '/admin/',
        '/admin-page/',
        '/api/',
        '/_next/',
        '/private/',
      ],
    },
    sitemap: 'https://korakagazindia.com/sitemap.xml',
  }
}
