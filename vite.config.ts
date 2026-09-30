/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// На GitHub Pages сайт живёт в подпапке репозитория.
const base = process.env.VITE_BASE ?? '/FoodCrafter/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico',
        'icons/favicon.svg',
        'icons/apple-touch-icon.png',
        'images/*.webp',
      ],
      manifest: {
        name: 'FoodCrafter — планирование питания',
        short_name: 'FoodCrafter',
        description:
          'Планирование питания на день, неделю и месяц: приёмы пищи, КБЖУ и автоматический список покупок.',
        lang: 'ru',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#1a1a17',
        theme_color: '#1a1a17',
        icons: [
          { src: 'icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png?v=2',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
