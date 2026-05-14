import type { MetadataRoute } from 'next'

const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_SHORT_URL_BASE || 'http://localhost:3000').replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: `${appUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1
    }
  ]
}
