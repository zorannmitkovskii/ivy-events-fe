<template>
  <div class="invite-page">
    <div class="invite-card">
      <h1 class="invite-title">{{ $t('collaborators.accept.title') }}</h1>
      <p class="invite-sub">
        {{ $t('collaborators.accept.subtitle') }}
      </p>

      <form @submit.prevent="submit">
        <label class="invite-label" for="invite-code">
          {{ $t('collaborators.accept.code') }}
        </label>
        <input
          id="invite-code"
          v-model.trim="code"
          class="invite-input"
          autocomplete="off"
          autocapitalize="characters"
          :disabled="loading"
        />

        <p v-if="error" class="invite-error">{{ error }}</p>

        <button class="invite-submit" type="submit" :disabled="loading || !code">
          {{ loading
            ? ($t('common.loading'))
            : ($t('collaborators.accept.submit')) }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collaboratorsService } from '@/services/collaborators.service';
import { refreshAccessToken } from '@/services/auth.service';
import { setEventId } from '@/store/onboarding.store';
import { getErrorMessage } from '@/services/apiError';

const route = useRoute();
const router = useRouter();

const code = ref('');
const loading = ref(false);
const error = ref('');

// A code arriving in the link is the common case — the organizer pastes the
// whole URL into a message. Prefilling it saves retyping something that is
// deliberately hard to read back.
onMounted(() => {
  const fromLink = route.query.code;
  if (typeof fromLink === 'string' && fromLink) code.value = fromLink;
});

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const { eventId } = await collaboratorsService.claim(code.value);

    // The claim added the event to eventIds in Keycloak, but the token in hand
    // was minted before that and does not carry it — every request would come
    // back 403 until it expired. Refreshing here is what makes the event
    // actually reachable on the next screen.
    await refreshAccessToken();

    setEventId(eventId);
    router.push(`/${route.params.lang || 'mk'}/dashboard/events/overview`);
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.invite-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.invite-card {
  width: 100%;
  max-width: 26rem;
  padding: 2rem;
  border-radius: 0.75rem;
  background: var(--surface, #fff);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
}

.invite-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.invite-sub {
  margin: 0 0 1.5rem;
  opacity: 0.75;
}

.invite-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.invite-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border, #d8d8d8);
  border-radius: 0.5rem;
  /* Codes are short, uppercase and read aloud or copied — spacing them out
     makes a mistyped character findable. */
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.invite-error {
  margin: 0.75rem 0 0;
  color: var(--danger, #b3261e);
  font-size: 0.875rem;
}

.invite-submit {
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.8125rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--brand-dark, #33452f);
  color: #fff;
  cursor: pointer;
}

.invite-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
