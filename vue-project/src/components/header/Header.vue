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
        <a href="#" @click="closeMenu">{{$t('header.menu.templates')}}</a>
        <a href="#" @click="closeMenu">{{$t('header.menu.features')}}</a>
        <a href="#" @click="closeMenu">{{$t('header.menu.pricing')}}</a>
        <a href="#" @click="closeMenu">{{$t('header.menu.faq')}}</a>
      </nav>

      <div class="mobile-actions">
        <button class="btn btn-main-outline w-full" @click="closeMenu">{{$t('header.actions.signIn')}}</button>
        <button class="btn btn-main w-full" @click="closeMenu">{{$t('header.actions.getStartedFree')}}</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount} from "vue";
import NavLinks from "@/components/header/NavLinks.vue";
import HeaderActions from "@/components/header/HeaderActions.vue";

const isMenuOpen = ref(false);

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape") closeMenu();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>

</style>
