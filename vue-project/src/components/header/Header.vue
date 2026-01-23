<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo">IvyEvents</div>

      <NavLinks/>
      <HeaderActions/>
      <!-- Mobile hamburger -->
      <button
        class="icon-btn mobile-only"
        type="button"
        aria-label="Open menu"
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
        <a href="#" @click="closeMenu">Templates</a>
        <a href="#" @click="closeMenu">Features</a>
        <a href="#" @click="closeMenu">Pricing</a>
        <a href="#" @click="closeMenu">FAQ</a>
      </nav>

      <div class="mobile-actions">
        <button class="btn btn-outline w-full" @click="closeMenu">Sign In</button>
        <button class="btn btn-primary w-full" @click="closeMenu">Get Started Free</button>
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

<style>

</style>
