import type { MetadataRoute } from 'next'

const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_SHORT_URL_BASE || 'http://localhost:3000').replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: `${appUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${appUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${appUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${appUrl}/forgot-password`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4
    }
  ]
}
