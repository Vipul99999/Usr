import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UrlShortener',
    short_name: 'UrlShortener',
    description:
      'Create branded short links, monitor campaign performance, and manage team-ready analytics from one focused workspace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#03111f',
    theme_color: '#03111f',
    categories: ['business', 'productivity', 'marketing'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}
