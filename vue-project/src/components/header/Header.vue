<template>
  <header class="app-header" :class="{ scrolled }">
    <div class="header-container">
      <!-- Logo -->
      <router-link :to="`/${lang}`" class="nav-brand">
        <img src="/logo.svg" alt="IvyEvents" class="logo-img" />
      </router-link>

      <!-- Desktop nav -->
      <NavLinks class="desktop-nav" />

      <!-- Desktop actions -->
      <div class="nav-r desktop-actions">
        <template v-if="loggedIn">
          <router-link :to="{ name: 'dashboard.overview', params: { lang } }" class="btn-fill">
            {{ fullName || $t('header.actions.myDashboard') }}
          </router-link>
        </template>
        <template v-else>
          <router-link :to="{ name: 'login', params: { lang } }" class="btn-outline">
            {{ $t('header.actions.signIn') }}
          </router-link>
          <router-link :to="{ name: 'signup', params: { lang } }" class="btn-fill">
            {{ $t('pricing.cta.getStarted') }}
          </router-link>
        </template>
        <div class="lang-toggle">
          <button
            v-for="loc in locales"
            :key="loc"
            class="lang-btn"
            :class="{ on: lang === loc }"
            @click="switchLang(loc)"
          >{{ loc.toUpperCase() }}</button>
        </div>
      </div>

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
    <div class="overlay" :class="{ show: isMenuOpen }" @click="closeMenu"></div>

    <!-- Mobile menu panel -->
    <div class="mobile-menu" :class="{ open: isMenuOpen }">
      <nav class="mobile-nav">
        <div class="mobile-accordion">
          <button class="mobile-accordion-toggle" @click="mobileCategoriesOpen = !mobileCategoriesOpen">
            <span>{{ $t('header.menu.categories') }}</span>
            <svg class="mobile-chevron" :class="{ rotated: mobileCategoriesOpen }" width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-show="mobileCategoriesOpen" class="mobile-accordion-body">
            <a v-for="item in categoryItems" :key="item.enumValue" href="#" @click.prevent="goToCategory(item.enumValue)">{{ $t(item.labelKey) }}</a>
          </div>
        </div>
        <a href="#" @click.prevent="goTo('packages')">{{ $t('header.menu.packages') }}</a>
        <a href="#" @click.prevent="goTo('about')">{{ $t('header.menu.about') }}</a>
        <a href="#" @click.prevent="goTo('contact')">{{ $t('header.menu.contact') }}</a>
      </nav>
      <div class="mobile-lang-switcher">
        <button v-for="loc in locales" :key="loc" class="lang-btn" :class="{ active: lang === loc }" @click="switchLang(loc)">{{ loc.toUpperCase() }}</button>
      </div>
      <div class="mobile-actions">
        <template v-if="loggedIn">
          <button class="btn btn-main w-full" @click="goToDashboard">{{ fullName || $t('header.actions.myDashboard') }}</button>
        </template>
        <template v-else>
          <button class="btn btn-main-outline w-full" @click="goToLogin">{{ $t('header.actions.signIn') }}</button>
          <button class="btn btn-main w-full" @click="goToSignup">{{ $t('header.actions.getStartedFree') }}</button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavLinks from "@/components/header/NavLinks.vue";
import { isAuthenticated, getFullName } from "@/services/auth.service";
import { EventCategoryEnum } from "@/enums/EventCategory.js";
import { setSelectedCategory } from "@/store/onboarding.store.js";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");
const loggedIn = computed(() => isAuthenticated());
const fullName = computed(() => getFullName());

const isMenuOpen = ref(false);
const mobileCategoriesOpen = ref(false);
const scrolled = ref(false);

const locales = ["mk", "en"];

const categoryItems = [
  { enumValue: EventCategoryEnum.WEDDING, labelKey: "header.menu.weddings" },
  { enumValue: EventCategoryEnum.BIRTHDAY, labelKey: "header.menu.birthdaysParties" },
  { enumValue: EventCategoryEnum.CORPORATE, labelKey: "header.menu.corporate" },
  { enumValue: EventCategoryEnum.CONFERENCE, labelKey: "header.menu.conferences" },
  { enumValue: EventCategoryEnum.DINNER, labelKey: "header.menu.privateDinners" },
  { enumValue: EventCategoryEnum.BABY_SHOWER, labelKey: "header.menu.babyShowers" },
  { enumValue: EventCategoryEnum.GRADUATION, labelKey: "header.menu.graduations" },
  { enumValue: EventCategoryEnum.ANNIVERSARY, labelKey: "header.menu.anniversaries" },
  { enumValue: EventCategoryEnum.GALLERY, labelKey: "header.menu.gallery" },
];

function toggleMenu() { isMenuOpen.value = !isMenuOpen.value; }
function closeMenu() { isMenuOpen.value = false; mobileCategoriesOpen.value = false; }
function goTo(path) { router.push(`/${lang.value}/${path}`); closeMenu(); }
function goToCategory(enumValue) { setSelectedCategory(enumValue); router.push({ path: `/${lang.value}/event-invitations` }); closeMenu(); }
function goToLogin() { router.push({ name: "login", params: { lang: lang.value } }); closeMenu(); }
function goToSignup() { router.push({ name: "signup", params: { lang: lang.value } }); closeMenu(); }
function goToDashboard() { router.push({ name: "dashboard.overview", params: { lang: lang.value } }); closeMenu(); }

function switchLang(newLang) {
  if (newLang === lang.value) return;
  router.push({ ...route, params: { ...route.params, lang: newLang } });
  closeMenu();
}

function onScroll() { scrolled.value = window.scrollY > 50; }
function onKeydown(e) { if (e.key === "Escape") closeMenu(); }

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKeydown);
  onScroll();
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.app-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 200;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(247, 245, 240, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s;
}

.app-header.scrolled {
  border-color: rgba(191, 210, 164, 0.45);
}

.header-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
}

.logo-img {
  height: 34px;
  width: auto;
}

/* Desktop nav */
.desktop-nav {
  display: flex;
}

/* Right actions */
.nav-r {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-outline {
  padding: 8px 20px;
  border: 1.5px solid var(--brand-main);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  color: var(--brand-main);
  text-decoration: none;
  transition: all 0.25s;
  white-space: nowrap;
}

.btn-outline:hover {
  background: var(--brand-main);
  color: #fff;
}

.btn-fill {
  padding: 8px 20px;
  background: var(--brand-main);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-decoration: none;
  transition: background 0.25s;
  white-space: nowrap;
}

.btn-fill:hover {
  background: var(--brand-dark);
}

/* Lang toggle */
.lang-toggle {
  display: flex;
  gap: 2px;
  background: var(--soft-light);
  border-radius: 8px;
  padding: 3px;
}

.lang-toggle .lang-btn {
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--neutral-500);
  cursor: pointer;
  transition: all 0.2s;
}

.lang-toggle .lang-btn.on {
  background: #fff;
  color: var(--brand-main);
  box-shadow: var(--shadow-sm);
}

/* Mobile */
.mobile-only {
  display: none;
}

/* Mobile lang */
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

.mobile-lang-switcher .lang-btn:hover { background: rgba(0, 0, 0, 0.04); }
.mobile-lang-switcher .lang-btn.active { background: var(--brand-main); color: #fff; border-color: var(--brand-main); }

/* Mobile accordion */
.mobile-accordion-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: var(--neutral-900);
  padding: 10px 12px;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.mobile-accordion-toggle:hover { background: var(--neutral-100); }
.mobile-chevron { transition: transform 0.2s ease; }
.mobile-chevron.rotated { transform: rotate(180deg); }

.mobile-accordion-body {
  display: grid;
  gap: 2px;
  padding: 2px 0 6px 16px;
}

.mobile-accordion-body a {
  text-decoration: none;
  color: var(--neutral-700);
  font-weight: 500;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.mobile-accordion-body a:hover { background: var(--neutral-100); color: var(--brand-main); }

@media (max-width: 900px) {
  .header-container { padding: 0 20px; }
  .desktop-nav, .desktop-actions { display: none !important; }
  .mobile-only { display: inline-flex; }
}
</style>
