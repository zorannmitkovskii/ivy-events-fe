import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router.js'
import keycloak from "./keycloak/keycloak.js";

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/styles/colors.css'
import './assets/styles/styles.css'
import './assets/styles/fonts.css'
import "bootstrap-icons/font/bootstrap-icons.css";
const app = createApp(App)
app.use(router)
app.mount('#app')

keycloak.init({ onLoad: "login-required" }).then(() => {
  const app = createApp(App);

  // Make Keycloak instance globally available
  app.config.globalProperties.$keycloak = keycloak;

  app.mount("#app");
});
