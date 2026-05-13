import type { MetadataRoute } from 'next'

const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SHORT_URL_BASE || 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api']
      }
    ],
    sitemap: `${appUrl.replace(/\/+$/, '')}/sitemap.xml`,
    host: appUrl.replace(/\/+$/, '')
  }
}
