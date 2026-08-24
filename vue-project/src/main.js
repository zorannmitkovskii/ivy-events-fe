import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import { initKeycloak, keycloak } from '@/auth/keycloak'
import i18n from '@/i18n'
import './services/auth.service'
import './services/events.service'
import { registerServiceWorker, showUpdatePrompt } from '@/services/pwa'

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
import './assets/styles/logo.css'
import './assets/styles/fonts.css'
import './assets/styles/components/index.css'
import './assets/styles/dashboard.css'
import "bootstrap-icons/font/bootstrap-icons.css";

/*
  The 2026 redesign, loaded last so it wins over Bootstrap and over the sheets
  above without needing !important to do it.

  - tokens: the palette and type, re-pointing the names the rest of the app
    already reads, so untouched screens re-skin on their own.
  - site:   the public site, scoped to `.ivy-site`. Scoped deliberately — the
    design's class names (.btn, .card, .link, .title) collide head-on with
    Bootstrap's, and unscoped they would restyle every dashboard button.
  - dash:   the dashboard shell and its primitives, all `d`-prefixed.
  - bridge: the leftovers on pages the design does not draw.
*/
import './assets/styles/ivy/tokens.css'
import './assets/styles/ivy/site.css'
import './assets/styles/ivy/dash.css'
import './assets/styles/ivy/bridge.css'

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
    // Offered, not forced, and above all not silent. This used to only write to
    // the console, on the belief that the new build would load "next time the
    // tab is opened fresh" — a waiting worker in fact activates only once every
    // tab of the origin is gone, and a refresh does not release control. So a
    // shipped change could stay invisible through any number of reloads, which
    // is exactly how it behaved.
    onUpdateAvailable: (applyUpdate) => showUpdatePrompt(applyUpdate),
  });
}

bootstrap();
