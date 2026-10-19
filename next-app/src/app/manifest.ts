import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VBridgeConnect — Capstone & Project Governance',
    short_name: 'VBridge',
    description: 'Academic & Industry Collaboration Hub for Capstone Projects and Governance',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#4F46E5',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
