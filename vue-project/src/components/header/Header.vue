<template>
  <header class="sitehead solid">
    <router-link :to="`/${lang}`" class="brand">
      <span class="ivy-logo logo-img" role="img" aria-label="Ivy Events"></span>
    </router-link>

    <NavLinks :class="{ open: isMenuOpen }" @navigate="closeMenu">
      <!--
        The redesign's header collapses its nav into one panel and stops there,
        because the concept site had five links and no session. This app also
        has a language switch and a signed-in state, and below 900px the
        `.actions` row they live in is hidden — so they ride into the same
        panel rather than opening a second sheet underneath it.
      -->
      <template #mobile>
        <div class="mobilelang">
          <button
            v-for="loc in locales"
            :key="loc"
            :class="{ on: lang === loc }"
            @click="switchLang(loc)"
          >{{ loc.toUpperCase() }}</button>
        </div>
        <div class="mobileactions">
          <template v-if="loggedIn">
            <button class="btn" @click="goToDashboard">
              {{ fullName || $t('header.actions.myDashboard') }}
            </button>
          </template>
          <template v-else>
            <button class="social" @click="goToLogin">{{ $t('header.actions.signIn') }}</button>
            <button class="btn" @click="goToSignup">{{ $t('header.actions.getStartedFree') }} ↗</button>
          </template>
        </div>
      </template>
    </NavLinks>

    <div class="actions">
      <template v-if="loggedIn">
        <router-link :to="{ name: 'dashboard.overview', params: { lang } }" class="btn mini">
          {{ fullName || $t('header.actions.myDashboard') }}
        </router-link>
      </template>
      <template v-else>
        <router-link :to="{ name: 'login', params: { lang } }">
          {{ $t('header.actions.signIn') }}
        </router-link>
        <router-link :to="{ name: 'signup', params: { lang } }" class="btn mini">
          {{ $t('pricing.cta.getStarted') }} ↗
        </router-link>
      </template>

      <div class="headlang">
        <button
          v-for="loc in locales"
          :key="loc"
          class="lang-btn"
          :class="{ on: lang === loc }"
          @click="switchLang(loc)"
        >{{ loc.toUpperCase() }}</button>
      </div>
    </div>

    <button
      class="hamb"
      type="button"
      :aria-label="$t('header.menu.openMenu')"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
      @click="toggleMenu"
    >{{ isMenuOpen ? '×' : '☰' }}</button>

    <div class="mobilescrim" :class="{ show: isMenuOpen }" @click="closeMenu"></div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavLinks from "@/components/header/NavLinks.vue";
import { isAuthenticated, getFullName } from "@/services/auth.service";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");
const loggedIn = computed(() => isAuthenticated());
const fullName = computed(() => getFullName());

const isMenuOpen = ref(false);
const locales = ["mk", "en"];

function toggleMenu() { isMenuOpen.value = !isMenuOpen.value; }
function closeMenu() { isMenuOpen.value = false; }
function goToLogin() { router.push({ name: "login", params: { lang: lang.value } }); closeMenu(); }
function goToSignup() { router.push({ name: "signup", params: { lang: lang.value } }); closeMenu(); }
function goToDashboard() { router.push({ name: "dashboard.overview", params: { lang: lang.value } }); closeMenu(); }

function switchLang(newLang) {
  if (newLang === lang.value) return;
  router.push({ ...route, params: { ...route.params, lang: newLang } });
  closeMenu();
}

function onKeydown(e) { if (e.key === "Escape") closeMenu(); }

// The header no longer moves or changes on scroll — the redesign puts it in
// the flow rather than fixed over the hero — so the scroll listener that fed
// the old `.scrolled` border is gone with it.
watch(() => route.fullPath, closeMenu);

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.brand .logo-img {
  --logo-h: 30px;
}

/*
  The real mark, not the concept's ✣ glyph.

  The design source draws the brand as a typographic lockup because it had no
  asset to hand; `public/logo.svg` is the actual one, and it is already a
  single-fill mask that takes `currentColor` — so it sits on the redesign's
  cream header and on the dark sidebar from the same file.
*/
.brand {
  color: var(--ink);
}

.mobilescrim {
  display: none;
}

@media (max-width: 900px) {
  .mobilescrim {
    display: block;
    position: fixed;
    inset: var(--header-height) 0 0;
    z-index: 25;
    background: rgba(7, 21, 15, 0.35);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
  }

  .mobilescrim.show {
    opacity: 1;
    pointer-events: auto;
  }

  .mobilelang {
    display: flex;
    gap: 6px;
    padding: 18px 0;
  }

  .mobilelang button {
    padding: 8px 14px;
    border: 1px solid var(--line-2);
    border-radius: var(--radius-control);
    background: transparent;
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--ink-3);
    cursor: pointer;
  }

  .mobilelang button.on {
    background: var(--ink);
    border-color: var(--ink);
    color: #fff;
  }

  .mobileactions {
    display: grid;
    gap: 10px;
  }

  .mobileactions .btn {
    width: 100%;
  }
}
</style>
