<template>
  <div class="actions desktop-actions">
    <!-- Auth-conditional buttons -->
    <template v-if="loggedIn">
      <ButtonMain
        :label="fullName || $t('header.actions.myDashboard')"
        :to="{ name: 'dashboard.overview', params: { lang } }"
        variant="main"
      />
    </template>
    <template v-else>
      <ButtonMain
        :label="$t('header.actions.signIn')"
        :to="{ name: 'login', params: { lang } }"
        variant="outline"
      />
      <ButtonMain
        :label="$t('pricing.cta.getStarted')"
        :to="{ name: 'signup', params: { lang } }"
        variant="main"
      />
    </template>

    <!-- Language switcher -->
    <div class="lang-switcher">
      <button
        v-for="loc in locales"
        :key="loc"
        class="lang-btn"
        :class="{ active: lang === loc }"
        @click="switchLang(loc)"
      >{{ loc.toUpperCase() }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { useRoute, useRouter } from "vue-router";
import { isAuthenticated, getFullName } from "@/services/auth.service";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");
const loggedIn = computed(() => isAuthenticated());
const fullName = computed(() => getFullName());

const locales = ["mk", "en"];

function switchLang(newLang) {
  if (newLang === lang.value) return;
  router.push({ ...route, params: { ...route.params, lang: newLang } });
}
</script>

<style scoped>
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-switcher {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.lang-btn {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--neutral-700);
  transition: background 0.2s, color 0.2s;
}

.lang-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.lang-btn.active {
  background: var(--brand-main);
  color: #fff;
}
</style>
