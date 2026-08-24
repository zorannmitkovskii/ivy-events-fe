<template>
  <nav ref="navRef" :aria-label="$t('header.menu.categories')">
    <div class="navcat" :class="{ open: categoriesOpen }">
      <button class="navcat-toggle" @click="categoriesOpen = !categoriesOpen">
        {{ $t('header.menu.categories') }}
        <svg class="chev" width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-show="categoriesOpen" class="navcat-menu">
        <a
          v-for="item in categoryItems"
          :key="item.enumValue"
          href="#"
          @click.prevent="goToCategory(item.enumValue)"
        >{{ $t(item.labelKey) }}</a>
      </div>
    </div>

    <router-link
      v-for="link in links"
      :key="link.labelKey"
      :to="`/${lang}/${link.path}`"
      @click="emit('navigate')"
    >{{ $t(link.labelKey) }}</router-link>

    <!-- Below 900px the nav is the mobile sheet, so the header hands it the
         session and language controls that have nowhere else to go. -->
    <div class="navextra">
      <slot name="mobile" />
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { EventCategoryEnum } from "@/enums/EventCategory.js";
import { setSelectedCategory } from "@/store/onboarding.store.js";

const emit = defineEmits(["navigate"]);

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");

const categoriesOpen = ref(false);
const navRef = ref(null);

const links = [
  // The vendor directory (EPIC-07). It was built, routed and filled, and then
  // linked from nowhere: /vendors was reachable only by typing it. Ninety-six
  // approved vendors were invisible to the people the directory exists for.
  { labelKey: "header.menu.vendors", path: "vendors" },
  { labelKey: "header.menu.packages", path: "packages" },
  { labelKey: "header.menu.about", path: "about" },
  { labelKey: "header.menu.faq", path: "faq" },
  { labelKey: "header.menu.contact", path: "contact" },
];

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
  emit("navigate");
}

function onClickOutside(e) {
  if (navRef.value && !navRef.value.contains(e.target)) categoriesOpen.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape") categoriesOpen.value = false;
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
/* Layout, colour and the open/closed behaviour of this `nav` all come from
   `.sitehead nav` in `ivy/site.css` — the design's own rule. What is here is
   only the category dropdown, which the concept header did not have. */

.navcat {
  position: relative;
}

.navcat-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.25s;
}

.navcat-toggle:hover,
.navcat.open .navcat-toggle {
  color: var(--gold);
}

.chev {
  transition: transform 0.2s;
}

.navcat.open .chev {
  transform: rotate(180deg);
}

.navcat-menu {
  position: absolute;
  top: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: grid;
  min-width: 210px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--paper);
  box-shadow: 0 18px 40px rgba(23, 55, 43, 0.14);
}

.navcat-menu a {
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  transition: background 0.15s, color 0.15s;
}

.navcat-menu a:hover {
  background: var(--brand-pale);
  color: var(--ink);
}

.navextra {
  display: none;
}

@media (max-width: 900px) {
  .navcat {
    width: 100%;
  }

  .navcat-menu {
    position: static;
    transform: none;
    border: 0;
    box-shadow: none;
    background: transparent;
    padding: 10px 0 0 12px;
  }

  .navextra {
    display: block;
    width: 100%;
    padding-top: 6px;
    border-top: 1px solid var(--line);
  }
}
</style>
