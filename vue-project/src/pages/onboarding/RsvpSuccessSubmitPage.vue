<template>
  <main class="success-page">
    <div class="success-card">
      <div class="success-icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="32" fill="#E8F5E9" />
          <path d="M20 33L28 41L44 25" stroke="#2E7D32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h1 class="success-title">{{ t('rsvpSuccess.title') }}</h1>
      <p class="success-message">{{ t('rsvpSuccess.message') }}</p>

      <div class="success-details" v-if="guestNames.length">
        <p class="details-label">{{ t('rsvpSuccess.guests') }}</p>
        <p class="details-value">{{ guestNames.join(', ') }}</p>
      </div>

      <div class="success-actions">
        <button class="back-btn" @click="goBack">{{ t('rsvpSuccess.back') }}</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const guestNames = computed(() => {
  const raw = route.query.names;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [raw];
  }
});

function goBack() {
  if (window.history.length > 2) {
    router.go(-2);
  } else {
    router.push({ name: 'home', params: { lang: route.params.lang || 'mk' } });
  }
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sunken);
  padding: 24px;
}

.success-card {
  max-width: 480px;
  width: 100%;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 48px 32px;
  text-align: center;
}

.success-icon {
  margin-bottom: 24px;
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 12px;
}

.success-message {
  font-size: 15px;
  color: var(--ink-3);
  line-height: 1.6;
  margin: 0 0 32px;
}

.success-details {
  background: var(--sunken);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 32px;
  text-align: left;
}

.details-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-4);
  margin: 0 0 4px;
}

.details-value {
  font-size: 15px;
  color: var(--ink);
  margin: 0;
}

.success-actions {
  display: flex;
  justify-content: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: 12px 32px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.back-btn:hover {
  background: var(--sunken);
  border-color: var(--line-2);
}
</style>