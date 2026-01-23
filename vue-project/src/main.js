import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import { initKeycloak, keycloak } from '@/auth/keycloak'
import i18n from '@/i18n'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/styles/colors.css'
import './assets/styles/styles.css'
import './assets/styles/fonts.css'
import './assets/styles/components/index.css'
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
}

bootstrap();
