import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import { initKeycloak, keycloak } from '@/auth/keycloak'
import i18n from '@/i18n'
import './services/auth.service'
import './services/events.service'
import { registerServiceWorker } from '@/services/pwa'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/styles/colors.css'
import './assets/styles/styles.css'
import './assets/styles/accordion.css'
import './assets/styles/base.css'
import './assets/styles/buttons.css'
import './assets/styles/cards.css'
import './assets/styles/footer.css'
import './assets/styles/navbar.css'
import './assets/styles/sections.css'
import './assets/styles/utilities.css'
import './assets/styles/variables.css'
import './assets/styles/fonts.css'
import './assets/styles/components/index.css'
import './assets/styles/dashboard.css'
import "bootstrap-icons/font/bootstrap-icons.css";

async function bootstrap() {
  try {
    await initKeycloak();
  } catch (err) {
    // Do not block app startup if Keycloak (auth server) is unreachable or misconfigured in local dev
    // The app will continue to work; routes that require auth should redirect to /login where BE handles login
    const msg = err && (err.message || err.toString());
    console.warn('[Keycloak] init failed. Continuing without SSO. Error:', msg);
    console.debug('[Keycloak] Full error object:', err);
  }
  const app = createApp(App);
  app.use(router);
  app.use(i18n);
  app.config.globalProperties.$keycloak = keycloak;
  app.mount('#app');

  // Offline check-in (IVY-602). After mount, not before: a service worker is
  // not worth delaying first paint for, and a registration that fails must not
  // stop the app loading.
  registerServiceWorker({
    onUpdateAvailable: () => {
      // Deliberately quiet. Reloading the page under somebody working a door
      // is not an improvement; the new build is picked up next time the tab is
      // opened fresh.
      console.info('[PWA] A new version is ready and will load on the next visit.');
    },
  });
}

bootstrap();
