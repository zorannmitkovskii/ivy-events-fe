import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
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
