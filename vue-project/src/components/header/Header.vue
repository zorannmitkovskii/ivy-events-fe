<template>
  <header class="header">
    <div class="wrap">
      <router-link :to="`/${lang}`" class="brand" :aria-label="$t('header.logo')">
        <span class="ivy-logo" role="img" :aria-label="$t('header.logo')"></span>
      </router-link>

      <nav class="nav" :aria-label="$t('header.menu.primary')">
        <router-link
          v-for="link in links"
          :key="link.labelKey"
          :to="`/${lang}/${link.path}`"
        >{{ $t(link.labelKey) }}</router-link>
      </nav>

      <div class="header-actions">
        <div class="langs" role="group" :aria-label="$t('header.menu.language')">
          <button
            v-for="loc in locales"
            :key="loc"
            type="button"
            :aria-pressed="lang === loc"
            @click="switchLang(loc)"
          >{{ loc.toUpperCase() }}</button>
        </div>

        <template v-if="loggedIn">
          <router-link class="btn btn-primary btn-sm" :to="dashboardTo">
            {{ fullName || $t('header.actions.myDashboard') }}
          </router-link>
        </template>
        <template v-else>
          <router-link class="login" :to="{ name: 'login', params: { lang } }">
            {{ $t('header.actions.signIn') }}
          </router-link>
          <router-link class="btn btn-primary btn-sm" :to="{ name: 'signup', params: { lang } }">
            {{ $t('header.actions.createInvitation') }}
          </router-link>
        </template>

        <button
          class="burger"
          type="button"
          :aria-label="isMenuOpen ? $t('header.menu.closeMenu') : $t('header.menu.openMenu')"
          :aria-expanded="isMenuOpen ? 'true' : 'false'"
          aria-controls="mnav"
          @click="isMenuOpen = !isMenuOpen"
        ><span></span></button>
      </div>
    </div>

    <!--
      One panel, and it is removed from the document when closed rather than
      hidden with `display:none` on a parent. `.mobile-nav` is only shown by
      `.open`, but a closed panel that is still in the tree is still tabbable
      on desktop, which is exactly the defect `home-quality.spec.js` pins.
    -->
    <nav v-if="isMenuOpen" id="mnav" class="mobile-nav open" :aria-label="$t('header.menu.primary')">
      <div class="wrap">
        <router-link
          v-for="link in mobileLinks"
          :key="link.labelKey"
          :to="`/${lang}/${link.path}`"
          @click="closeMenu"
        >{{ $t(link.labelKey) }}</router-link>

        <div class="langs langs--panel" role="group" :aria-label="$t('header.menu.language')">
          <button
            v-for="loc in locales"
            :key="loc"
            type="button"
            :aria-pressed="lang === loc"
            @click="switchLang(loc)"
          >{{ loc.toUpperCase() }}</button>
        </div>

        <div class="cta-row">
          <template v-if="loggedIn">
            <router-link class="btn btn-primary" :to="dashboardTo" @click="closeMenu">
              {{ fullName || $t('header.actions.myDashboard') }}
            </router-link>
          </template>
          <template v-else>
            <router-link class="btn btn-ghost" :to="{ name: 'login', params: { lang } }" @click="closeMenu">
              {{ $t('header.actions.signIn') }}
            </router-link>
            <router-link class="btn btn-primary" :to="{ name: 'signup', params: { lang } }" @click="closeMenu">
              {{ $t('header.actions.createInvitation') }}
            </router-link>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAuthenticated, getFullName } from '@/services/auth.service'

const route = useRoute()
const router = useRouter()
const lang = computed(() => route.params.lang || 'mk')
const loggedIn = computed(() => isAuthenticated())
const fullName = computed(() => getFullName())

const isMenuOpen = ref(false)
const locales = ['mk', 'en', 'sq']

/*
  The redesign's nav is six flat links and no dropdown. The category menu the
  old header carried is gone on purpose, not lost: the same eight categories
  are now the filter row on the invitation catalogue, which is a better place
  for them — they filter something visible instead of teleporting you.

  The vendor directory keeps its link. It is not in the mockup's nav, but it
  was linked from nowhere once already and ninety-six approved vendors were
  invisible for it; that is not a mistake to repeat for the sake of parity.
*/
const links = [
  { labelKey: 'header.menu.invitations', path: 'designs' },
  { labelKey: 'header.menu.vendors', path: 'vendors' },
  { labelKey: 'header.menu.packages', path: 'packages' },
  { labelKey: 'header.menu.blog', path: 'blog' },
  { labelKey: 'header.menu.about', path: 'about' },
  { labelKey: 'header.menu.faq', path: 'faq' },
  { labelKey: 'header.menu.contact', path: 'contact' },
]

const mobileLinks = computed(() => [{ labelKey: 'header.menu.home', path: '' }, ...links])

const dashboardTo = computed(() => ({ name: 'dashboard.overview', params: { lang: lang.value } }))

function closeMenu() {
  isMenuOpen.value = false
}

function switchLang(newLang) {
  if (newLang === lang.value) return
  router.push({ ...route, params: { ...route.params, lang: newLang } })
  closeMenu()
}

function onKeydown(e) {
  if (e.key === 'Escape') closeMenu()
}

watch(() => route.fullPath, closeMenu)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* Layout and colour come from `.header` in `ivy/site.css` — the design's own
   rules. Only the two things the mockup had no need for live here. */

/* The mark is the real one. The mockup draws an ivy leaf plus a wordmark set
   in Fraunces because it had no asset to hand; `public/logo.svg` is the
   artwork, and as a mask painted with `currentColor` it sits on the paper
   header, the dark sidebar and the footer from a single file. */
.brand .ivy-logo {
  --logo-h: 26px;
  color: var(--ink);
}

/* One line under a nav link, never two. `site.css` underlines every hovered
   link with a rule more specific than its own `.nav a:hover` opt-out, so the
   active link showed the gold bar plus a text underline beneath it. The hover
   line is drawn where the gold bar sits instead, and the active link keeps
   its gold one. The selector repeats the generic rule's `:not()`s to outrank it. */
.header .nav a {
  position: relative;
}

.header .nav a:not(.btn):not(.brand):not(.card-link):hover {
  text-decoration: none;
}

.nav a:not([aria-current='page']):hover::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 5px;
  height: 2px;
  border-radius: 2px;
  background: var(--ink);
}

/* Three languages, in the pill idiom the design uses for the invitation's own
   MK/EN switch. Hidden with the rest of the header actions on narrow screens
   — the panel carries the switch there. */
.langs {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--card);
}

.langs button {
  padding: 5px 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-3);
}

.langs button[aria-pressed='true'] {
  background: var(--ivy);
  color: var(--on-ivy);
}

@media (max-width: 1020px) {
  .langs {
    display: none;
  }

  /* …except the one inside the panel, which is where it went. */
  .langs--panel {
    display: inline-flex;
    margin: 16px 0 0;
  }
}
</style>
