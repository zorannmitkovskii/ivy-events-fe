<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo -->
      <router-link :to="`/${lang}`" class="logo">
        <img src="/logo.svg" alt="IvyEvents" class="logo__img" />
      </router-link>

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
        <!-- Categories accordion -->
        <div class="mobile-accordion">
          <button class="mobile-accordion-toggle" @click="mobileCategoriesOpen = !mobileCategoriesOpen">
            <span>{{ $t('header.menu.categories') }}</span>
            <svg class="mobile-chevron" :class="{ rotated: mobileCategoriesOpen }" width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div v-show="mobileCategoriesOpen" class="mobile-accordion-body">
            <a
              v-for="item in categoryItems"
              :key="item.enumValue"
              href="#"
              @click.prevent="goToCategory(item.enumValue)"
            >{{ $t(item.labelKey) }}</a>
          </div>
        </div>

        <!-- Packages link -->
        <a href="#" @click.prevent="goTo('packages')">{{ $t('header.menu.packages') }}</a>

        <!-- Static links -->
        <a href="#" @click.prevent="goTo('about')">{{ $t('header.menu.about') }}</a>
        <a href="#" @click.prevent="goTo('terms')">{{ $t('header.menu.terms') }}</a>
        <a href="#" @click.prevent="goTo('contact')">{{ $t('header.menu.contact') }}</a>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavLinks from "@/components/header/NavLinks.vue";
import HeaderActions from "@/components/header/HeaderActions.vue";
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

const locales = ["mk", "en", "sq"];

const categoryItems = [
  { enumValue: EventCategoryEnum.WEDDING, labelKey: "header.menu.weddings" },
  { enumValue: EventCategoryEnum.BIRTHDAY, labelKey: "header.menu.birthdaysParties" },
  { enumValue: EventCategoryEnum.CORPORATE, labelKey: "header.menu.corporate" },
  { enumValue: EventCategoryEnum.CONFERENCE, labelKey: "header.menu.conferences" },
  { enumValue: EventCategoryEnum.DINNER, labelKey: "header.menu.privateDinners" },
  { enumValue: EventCategoryEnum.BABY_SHOWER, labelKey: "header.menu.babyShowers" },
  { enumValue: EventCategoryEnum.GRADUATION, labelKey: "header.menu.graduations" },
  { enumValue: EventCategoryEnum.ANNIVERSARY, labelKey: "header.menu.anniversaries" },
];

function mobileRoute(path) {
  return `/${lang.value}/${path}`;
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
  mobileCategoriesOpen.value = false;
}

function goTo(path) {
  router.push(mobileRoute(path));
  closeMenu();
}

function goToCategory(enumValue) {
  setSelectedCategory(enumValue);
  router.push({ path: `/${lang.value}/event-invitations` });
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

/* Mobile accordion */
.mobile-accordion {
  border-radius: 12px;
}

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
  transition: background 0.2s ease, color 0.2s ease;
}

.mobile-accordion-toggle:hover {
  background: var(--neutral-100);
  color: var(--brand-main);
}

.mobile-chevron {
  transition: transform 0.2s ease;
}

.mobile-chevron.rotated {
  transform: rotate(180deg);
}

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
  transition: background 0.2s ease, color 0.2s ease;
}

.mobile-accordion-body a:hover {
  background: var(--neutral-100);
  color: var(--brand-main);
}
</style>
