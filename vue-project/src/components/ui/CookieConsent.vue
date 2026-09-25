<template>
  <div
    v-if="visible"
    class="cookie-consent"
    role="dialog"
    aria-modal="false"
    :aria-label="t('cookieConsent.title')"
  >
    <div class="cc-body">
      <p class="cc-title">{{ t('cookieConsent.title') }}</p>
      <p class="cc-text">{{ t('cookieConsent.text') }}</p>
    </div>

    <div class="cc-actions">
      <button type="button" class="cc-btn cc-ghost" data-track="cookie-decline" @click="decline">
        {{ t('cookieConsent.decline') }}
      </button>
      <button type="button" class="cc-btn cc-solid" data-track="cookie-accept" @click="accept">
        {{ t('cookieConsent.accept') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The consent gate (IVY-906).
 *
 * <p>Shown once, until answered. Declining is a button of the same size as
 * accepting and one click away — a banner where refusing is harder than
 * agreeing is not consent, and it is the version regulators write about.
 *
 * <p>Deliberately not a modal that traps focus or blocks the page. Nothing here
 * is required to read the site, so nothing here should stand in front of it.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { consentState, setConsent } from '@/composables/useSiteAnalytics'

const { t } = useI18n()
const visible = ref(false)

onMounted(() => {
  // A visitor who already answered is never asked again. A browser that
  // refuses storage reads as unanswered, and gets asked each visit — annoying,
  // but the alternative is counting somebody who never agreed.
  visible.value = consentState() === null
})

function accept() {
  setConsent(true)
  visible.value = false
}

function decline() {
  setConsent(false)
  visible.value = false
}
</script>

<style scoped>
/*
  Self-contained on purpose. The 2026 design system lives under `.ivy-site` and
  this banner renders in App.vue, outside it — design-system class names would
  arrive unstyled here. The tokens are global, so those are used directly.
*/
.cookie-consent {
  position: fixed;
  z-index: 1080;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  justify-content: space-between;
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 18px;
  border: 1px solid var(--line, #d6ded4);
  border-radius: 12px;
  background: var(--card, #ffffff);
  color: var(--ink, #142019);
  box-shadow: 0 10px 30px rgba(20, 32, 25, 0.16);
  font-size: 14px;
  line-height: 1.45;
}

.cc-body {
  flex: 1 1 320px;
  min-width: 0;
}

.cc-title {
  margin: 0 0 2px;
  font-weight: 600;
}

.cc-text {
  margin: 0;
  color: var(--ink-2, #4b5a52);
}

.cc-actions {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}

.cc-btn {
  font: inherit;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.cc-solid {
  border: 1px solid var(--ivy, #1e3d30);
  background: var(--ivy, #1e3d30);
  color: var(--on-ivy, #ffffff);
}

.cc-solid:hover {
  background: var(--ivy-soft, #2b5240);
}

.cc-ghost {
  border: 1px solid var(--line, #d6ded4);
  background: transparent;
  color: var(--ink, #142019);
}

.cc-ghost:hover {
  background: var(--mist-2, #f0f4ee);
}

.cc-btn:focus-visible {
  outline: 2px solid var(--gold, #c99b4a);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .cookie-consent {
    align-items: stretch;
  }

  .cc-actions {
    width: 100%;
  }

  .cc-btn {
    flex: 1;
  }
}
</style>
