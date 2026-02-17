<template>
  <ul class="nav-links">
    <!-- Categories dropdown -->
    <li class="nav-item has-submenu" ref="categoriesRef">
      <button
        class="categories-toggle"
        :class="{ open: categoriesOpen }"
        @click="categoriesOpen = !categoriesOpen"
      >
        {{ $t('header.menu.categories') }}
        <svg class="chevron" :class="{ rotated: categoriesOpen }" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <ul v-show="categoriesOpen" class="categories-menu">
        <li v-for="item in categoryItems" :key="item.enumValue">
          <a href="#" class="categories-item" @click.prevent="goToCategory(item.enumValue)">
            {{ $t(item.labelKey) }}
          </a>
        </li>
      </ul>
    </li>

    <!-- Packages link -->
    <li class="nav-item">
      <router-link class="nav-link" :to="`/${lang}/packages`">{{ $t('header.menu.packages') }}</router-link>
    </li>

    <!-- Static links -->
    <li class="nav-item">
      <router-link class="nav-link" :to="`/${lang}/about`">{{ $t('header.menu.about') }}</router-link>
    </li>
    <li class="nav-item">
      <router-link class="nav-link" :to="`/${lang}/terms`">{{ $t('header.menu.terms') }}</router-link>
    </li>
    <li class="nav-item">
      <router-link class="nav-link" :to="`/${lang}/contact`">{{ $t('header.menu.contact') }}</router-link>
    </li>
  </ul>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { EventCategoryEnum } from "@/enums/EventCategory.js";
import { setSelectedCategory } from "@/store/onboarding.store.js";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");

const categoriesOpen = ref(false);
const categoriesRef = ref(null);

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

function goToCategory(enumValue) {
  categoriesOpen.value = false;
  setSelectedCategory(enumValue);
  router.push({ path: `/${lang.value}/event-invitations` });
}

function closeAll() {
  categoriesOpen.value = false;
}

function onClickOutside(e) {
  if (categoriesRef.value && !categoriesRef.value.contains(e.target)) {
    categoriesOpen.value = false;
  }
}

function onKeydown(e) {
  if (e.key === "Escape") closeAll();
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  position: relative;
}

.categories-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-700);
  padding: 6px 2px;
  transition: color 0.2s ease;
}

.categories-toggle:hover,
.categories-toggle.open {
  color: var(--brand-dark);
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.categories-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background: var(--bg-white, #fff);
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 6px;
  list-style: none;
  z-index: 100;
}

.categories-item {
  display: block;
  padding: 10px 14px;
  text-decoration: none;
  color: var(--neutral-700);
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
}

.categories-item:hover {
  background: var(--neutral-100, #f3f4f6);
  color: var(--brand-dark);
}

.nav-link {
  text-decoration: none;
  color: var(--neutral-700);
  font-weight: 500;
  font-size: 14px;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--brand-dark);
}
</style>
