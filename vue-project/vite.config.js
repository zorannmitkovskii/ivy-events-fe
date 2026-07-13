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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('keycloak-js')) return 'vendor-keycloak';
            if (/[\\/](vue|vue-router|vue-i18n|@vue)[\\/]/.test(id)) return 'vendor-vue';
            if (id.includes('/axios/')) return 'vendor-http';
            if (id.includes('/bootstrap/') || id.includes('@popperjs')) return 'vendor-bootstrap';
            if (id.includes('/chart.js/')) return 'vendor-charts';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
