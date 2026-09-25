<template>
  <main class="host">
    <p v-if="loading" class="state">{{ t('common.loading') }}</p>

    <section v-else-if="missing" class="state missing">
      <h1>{{ t('eventSite.notFound') }}</h1>
      <p>{{ t('eventSite.notFoundHint') }}</p>
    </section>

    <p v-else-if="error" class="state error" role="alert">{{ error }}</p>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { resolveVendorHost } from '@/services/vendorHost'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const missing = ref(false)
const error = ref('')

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(async () => {
  const { host } = resolveVendorHost(route.params.slug)

  try {
    const target = unwrap(await api.get('/public/site', { params: { host } }))

    if (target?.kind !== 'EVENT' || !target.live) {
      missing.value = true
      return
    }

    // The address gets a guest to the invitation; the invitation itself is
    // the page that already exists, and it keeps its own token rules. This
    // page resolves and hands over rather than rendering a second copy —
    // two invitation pages would drift the first time either was edited.
    const page = unwrap(
      await api.get(`/public/invitation-page/${encodeURIComponent(target.id)}`))

    const invitationUrl = page?.event?.invitationUrl
    if (!invitationUrl) {
      missing.value = true
      return
    }

    // Only the path. The origin in that field is whatever host built it, and
    // following it would bounce a guest off the address they just typed.
    const inside = new URL(invitationUrl, window.location.origin)
    router.replace({
      path: inside.pathname,
      query: { ...Object.fromEntries(inside.searchParams), ...route.query },
    })
  } catch (e) {
    if (e?.status === 404 || e?.response?.status === 404) {
      missing.value = true
    } else {
      error.value = e?.detail ?? e?.response?.data?.message ?? e.message
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.host { min-height: 100vh; background: #fff; }

.state {
  padding: 22vh 24px;
  text-align: center;
  color: #6b665e;
  font-family: 'Golos Text', system-ui, sans-serif;
}

.missing h1 {
  font-family: 'Literata', Georgia, serif;
  font-size: clamp(24px, 5vw, 34px);
  color: #1d1b18;
  margin: 0 0 10px;
}

.missing p { margin: 0; }
.error { color: #b3261e; }
</style>
