<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo">
        <img src="/logo.svg" alt="IvyEvents" class="logo__img" />
      </div>

      <NavLinks class="desktop-nav"/>
      <HeaderActions class="desktop-actions"/>
      <!-- Mobile hamburger -->
      <button
        class="icon-btn mobile-only"
        type="button"
        :aria-label="$t('header.menu.openMenu')"
        :aria-expanded="isMenuOpen ? 'true' : 'false'"
        @click="toggleMenu"
      >
        <span class="hamburger" :class="{ open: isMenuOpen }"></span>
      </button>
    </div>

    <!-- Mobile menu overlay -->
    <div
      class="overlay"
      :class="{ show: isMenuOpen }"
      @click="closeMenu"
    ></div>

    <!-- Mobile menu panel (dropdown) -->
    <div class="mobile-menu" :class="{ open: isMenuOpen }">
      <nav class="mobile-nav">
        <a
          v-for="link in mobileLinks"
          :key="link.labelKey"
          href="#"
          @click.prevent="goTo(link.to)"
        >{{ $t(link.labelKey) }}</a>
      </nav>

      <!-- Mobile language switcher -->
      <div class="mobile-lang-switcher">
        <button
          v-for="loc in locales"
          :key="loc"
          class="lang-btn"
          :class="{ active: lang === loc }"
          @click="switchLang(loc)"
        >{{ loc.toUpperCase() }}</button>
      </div>

      <!-- Mobile auth-conditional actions -->
      <div class="mobile-actions">
        <template v-if="loggedIn">
          <button class="btn btn-main w-full" @click="goToDashboard">
            {{ fullName || $t('header.actions.myDashboard') }}
          </button>
        </template>
        <template v-else>
          <button class="btn btn-main-outline w-full" @click="goToLogin">{{$t('header.actions.signIn')}}</button>
          <button class="btn btn-main w-full" @click="goToSignup">{{$t('header.actions.getStartedFree')}}</button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from "vue";
import { useRoute, useRouter } from "vue-router";
import NavLinks from "@/components/header/NavLinks.vue";
import HeaderActions from "@/components/header/HeaderActions.vue";
import { isAuthenticated, getFullName } from "@/services/auth.service";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");
const loggedIn = computed(() => isAuthenticated());
const fullName = computed(() => getFullName());

const isMenuOpen = ref(false);

const locales = ["mk", "en", "sq"];

const mobileLinks = [
  { labelKey: "header.menu.templates", to: "/" },
  { labelKey: "header.menu.features", to: "features" },
  { labelKey: "header.menu.pricing", to: "pricing" },
  { labelKey: "header.menu.faq", to: "/" },
];

function mobileRoute(path) {
  return `/${lang.value}/${path}`;
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function goTo(path) {
  router.push(mobileRoute(path));
  closeMenu();
}

function goToLogin() {
  router.push({ name: "login", params: { lang: lang.value } });
  closeMenu();
}

function goToSignup() {
  router.push({ name: "signup", params: { lang: lang.value } });
  closeMenu();
}

function goToDashboard() {
  router.push({ name: "dashboard.overview", params: { lang: lang.value } });
  closeMenu();
}

function switchLang(newLang) {
  if (newLang === lang.value) return;
  router.push({ ...route, params: { ...route.params, lang: newLang } });
  closeMenu();
}

function onKeydown(e) {
  if (e.key === "Escape") closeMenu();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.mobile-lang-switcher {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.mobile-lang-switcher .lang-btn {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  cursor: pointer;
  color: var(--neutral-700);
  transition: background 0.2s, color 0.2s;
}

.mobile-lang-switcher .lang-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.mobile-lang-switcher .lang-btn.active {
  background: var(--brand-main);
  color: #fff;
  border-color: var(--brand-main);
}
</style>
