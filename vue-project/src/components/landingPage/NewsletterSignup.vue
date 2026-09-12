<template>
  <div class="newsletter">
    <p>{{ $t('home.blog.newsletterPromise') }}</p>
    <form @submit.prevent="submit">
      <input
        v-model="email"
        type="email"
        required
        :disabled="state === 'done'"
        placeholder="ime@email.mk"
        :aria-label="$t('home.blog.emailLabel')"
        :aria-invalid="state === 'failed' ? 'true' : null"
      />
      <button class="btn btn-primary btn-sm" type="submit" :disabled="state !== 'idle'">
        {{ buttonLabel }}
      </button>
    </form>
    <p v-if="state === 'failed'" class="newsletter-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { newsletterService } from '@/services/newsletter.service'
import { getErrorMessage } from '@/services/apiError'

/*
  The mockup's version replaces the button label with "Пријавени сте" on
  submit and posts nowhere. This one posts, and can therefore fail — so it has
  three states rather than two, and says which one it is in. A signup that
  silently reports success it did not achieve is worse than no signup.
*/

const { t, locale } = useI18n()

const email = ref('')
const state = ref('idle')
const error = ref('')

const buttonLabel = computed(() => {
  if (state.value === 'done') return t('home.blog.subscribed')
  if (state.value === 'sending') return t('home.blog.subscribing')
  return t('home.blog.subscribe')
})

async function submit() {
  state.value = 'sending'
  try {
    await newsletterService.subscribe(email.value, locale.value)
    state.value = 'done'
    email.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
    state.value = 'failed'
  }
}
</script>

<style scoped>
.newsletter-error {
  margin-top: 10px;
  color: var(--error);
  font-size: 14px;
}
</style>
