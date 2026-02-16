<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo">{{$t('header.logo')}}</div>

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

      <div class="mobile-actions">
        <button class="btn btn-main-outline w-full" @click="goToLogin">{{$t('header.actions.signIn')}}</button>
        <button class="btn btn-main w-full" @click="goToSignup">{{$t('header.actions.getStartedFree')}}</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from "vue";
import { useRoute, useRouter } from "vue-router";
import NavLinks from "@/components/header/NavLinks.vue";
import HeaderActions from "@/components/header/HeaderActions.vue";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");

const isMenuOpen = ref(false);

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

function onKeydown(e) {
  if (e.key === "Escape") closeMenu();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>

</style>
