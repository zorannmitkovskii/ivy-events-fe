import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    /**
     * Offline check-in (IVY-602).
     *
     * Venues have thick walls and the door is usually the worst spot in the
     * building. Staff need to keep scanning through a dead patch, so the app
     * shell is precached and the queue of arrivals lives in IndexedDB until
     * there is signal again.
     *
     * `registerType: 'prompt'` on purpose: swapping the running app for a new
     * build in the middle of a queue at the door is not an improvement. The
     * user is asked, and can say later.
     */
    VitePWA({
      registerType: 'prompt',
      manifest: false, // public/manifest.json is already the source of truth
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        // Any route falls back to the shell so a refresh with no signal opens
        // the app rather than the browser's dinosaur.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/v1\/api/, /^\/public\//],
        runtimeCaching: [
          {
            // The guest list, so a reload at the door still shows names.
            // Network first: a stale list is a fallback, not the default.
            urlPattern: ({ url }) => url.pathname.includes('/check-in/')
              || url.pathname.includes('/guests'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ivy-checkin-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 12 },
            },
          },
        ],
      },
      devOptions: {
        // Off in dev: a service worker caching a hot-reloading app is a
        // debugging session nobody asked for.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // The sitemap is the backend's, built from what is actually published
  // (IVY-907). In production nginx sends these paths to the API; in development
  // this does, so localhost:5173/sitemap.xml is the real one.
  server: {
    proxy: {
      '^/sitemap(-\\d+)?\\.xml$': { target: 'http://localhost:8081', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'vue-i18n'],
          'vendor-http': ['axios'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // e2e/ belongs to Playwright. Vitest picks up any *.spec.js it can see, and
    // a Playwright spec run under Vitest fails on the imports rather than on
    // anything real.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
})
