import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'

const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SHORT_URL_BASE || 'http://localhost:3000'
const normalizedAppUrl = appUrl.replace(/\/+$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(normalizedAppUrl),
  title: {
    default: 'UrlShortener | Short links, campaign analytics, and teamwork',
    template: '%s | UrlShortener'
  },
  description:
    'Create branded short links, monitor campaign performance, invite teammates, and ship faster with a link platform built for modern startups.',
  applicationName: 'UrlShortener',
  manifest: '/manifest.webmanifest',
  category: 'technology',
  creator: 'UrlShortener',
  publisher: 'UrlShortener',
  authors: [{ name: 'UrlShortener' }],
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  keywords: [
    'URL shortener',
    'link analytics',
    'custom domains',
    'campaign tracking',
    'short links',
    'QR codes',
    'startup SaaS'
  ],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'UrlShortener',
    description:
      'Create branded short links, monitor campaign performance, and collaborate with your team in one focused workspace.',
    url: normalizedAppUrl,
    siteName: 'UrlShortener',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'UrlShortener dashboard preview'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UrlShortener',
    description:
      'Create branded short links, track clicks, and manage campaigns with a fast startup-friendly link platform.',
    images: ['/twitter-image']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  }
}

export const viewport: Viewport = {
  themeColor: '#03111f',
  colorScheme: 'dark'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
