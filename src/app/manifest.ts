import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SpaceLY — Book Creative Studios in Lagos',
    short_name: 'SpaceLY',
    description: "Lagos's first hourly creative workspace marketplace. Book photography studios, fashion ateliers, recording studios, and more.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F5EDD6',
    theme_color: '#C4472B',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
