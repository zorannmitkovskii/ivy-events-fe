<template>
  <div class="hub">
    <p v-if="loading" class="loading">{{ t('hub.loading') }}</p>

    <div v-else-if="error" class="refused" role="alert">
      <h1>{{ t('hub.refusedTitle') }}</h1>
      <p>{{ error }}</p>
    </div>

    <article v-else-if="view" class="card">
      <header class="head">
        <h1>{{ localized(view.eventName, view.eventNameI18n) }}</h1>
        <p v-if="view.date" class="date">{{ formattedDate }}</p>
        <p v-if="view.message" class="message">{{ localized(view.message, view.messageI18n) }}</p>
      </header>

      <!-- Announcements first when there are any: "the ceremony moved indoors"
           outranks knowing which table you are on. -->
      <section v-if="view.announcements?.length" class="block announcements">
        <div
          v-for="item in view.announcements"
          :key="item.id"
          class="announcement"
          :class="{ urgent: item.urgent }"
        >
          <p class="announcement-title">{{ localized(item.title, item.titleI18n) }}</p>
          <p v-if="item.body" class="announcement-body">{{ localized(item.body, item.bodyI18n) }}</p>
        </div>
      </section>

      <!-- Labelled as a forecast with the time it was read, because "22°, no
           rain" seen on Tuesday and shown unchanged on Saturday is how somebody
           ends up without a marquee. -->
      <section v-if="view.weather" class="block weather">
        <h2>{{ t('hub.forecast') }}</h2>
        <template v-if="view.weather.available">
          <p class="temps">
            {{ Math.round(view.weather.temperatureMinC) }}° – {{ Math.round(view.weather.temperatureMaxC) }}°
          </p>
          <p v-if="view.weather.precipitationProbability != null" class="rain">
            {{ t('hub.chanceOfRain', { n: view.weather.precipitationProbability }) }}
          </p>
          <p class="provenance">
            {{ t('hub.forecastNote', { source: view.weather.source, when: forecastRead }) }}
          </p>
        </template>
        <p v-else class="provenance">{{ t('hub.forecastUnavailable') }}</p>
      </section>

      <!-- Where they sit. The thing a guest actually opens this for while
           standing in a doorway. -->
      <section v-if="view.table" class="block table-block">
        <h2>{{ t('hub.yourTable') }}</h2>
        <p class="table-title">{{ view.table.title }}</p>
        <p v-if="view.table.tablemates.length" class="tablemates">
          {{ t('hub.sittingWith') }}: {{ view.table.tablemates.join(', ') }}
        </p>
      </section>

      <section v-if="view.party.length > 1" class="block">
        <h2>{{ t('hub.yourParty') }}</h2>
        <ul class="party">
          <li v-for="member in view.party" :key="member.guestId">{{ member.name }}</li>
        </ul>
      </section>

      <section v-if="view.agenda.length" class="block">
        <h2>{{ t('hub.agenda') }}</h2>
        <ol class="agenda">
          <li v-for="item in view.agenda" :key="item.id">
            <span class="time">{{ item.time }}</span>
            <span class="what">{{ localized(item.description, item.descriptionI18n) }}</span>
            <span v-if="item.location?.name" class="where">{{ item.location.name }}</span>
          </li>
        </ol>
      </section>

      <section v-if="view.locations.length" class="block">
        <h2>{{ t('hub.gettingThere') }}</h2>
        <div v-for="(place, i) in view.locations" :key="i" class="place">
          <p class="place-name">{{ place.name }}</p>
          <p v-if="place.addressLine" class="place-address">
            {{ [place.addressLine, place.city].filter(Boolean).join(', ') }}
          </p>
          <!-- Parking and directions live in the location's notes. -->
          <p v-if="place.notes" class="place-notes">{{ place.notes }}</p>
          <a v-if="place.googleMapsUrl" class="map-link" :href="place.googleMapsUrl" target="_blank" rel="noopener">
            {{ t('hub.openMap') }}
          </a>
        </div>
      </section>

      <section v-if="view.contacts.length" class="block">
        <h2>{{ t('hub.whoToCall') }}</h2>
        <ul class="contacts">
          <li v-for="(contact, i) in view.contacts" :key="i">
            <span>{{ contact.name }}</span>
            <a v-if="contact.phone" :href="`tel:${contact.phone}`">{{ contact.phone }}</a>
          </li>
        </ul>
      </section>

      <!-- Says plainly that this is the last known copy, rather than showing
           stale information as though it were current. -->
      <p v-if="fromCache" class="cached">{{ t('hub.showingCached', { when: cachedWhen }) }}</p>
    </article>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { hubService } from '@/services/hub.service'

const { t, locale } = useI18n()
const route = useRoute()

const view = ref(null)
const loading = ref(true)
const error = ref('')
const fromCache = ref(false)
const cachedAt = ref(null)

/**
 * The last view this browser saw, kept so a guest standing in a car park with
 * one bar of signal can still read their table number.
 *
 * Keyed by token so one phone can hold two invitations without them
 * overwriting each other.
 */
const CACHE_PREFIX = 'ivy-hub-'

function cacheKey(token) {
  return CACHE_PREFIX + token.slice(-24)
}

onMounted(async () => {
  const token = route.query.t || route.params.token || ''
  if (!token) {
    error.value = t('hub.noToken')
    loading.value = false
    return
  }

  try {
    const response = await hubService.open(token)
    view.value = response?.data ?? response
    saveToCache(token, view.value)
  } catch (e) {
    const cached = readCache(token)
    if (cached) {
      // A refusal might be a withdrawn link or might be a dead connection.
      // Showing the last known copy and labelling it is more use than an
      // error page to somebody who is already at the venue.
      view.value = cached.view
      fromCache.value = true
      cachedAt.value = cached.cachedAt
    } else {
      error.value = e?.detail || e?.message || t('hub.refusedBody')
    }
  } finally {
    loading.value = false
  }
})

function saveToCache(token, value) {
  try {
    localStorage.setItem(cacheKey(token), JSON.stringify({ view: value, cachedAt: Date.now() }))
  } catch {
    // A full or disabled storage is not worth failing the page over.
  }
}

function readCache(token) {
  try {
    const raw = localStorage.getItem(cacheKey(token))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Falls back to the plain field when there is no translation for the
 *  guest's language — a missing translation must not blank the page. */
function localized(plain, i18nMap) {
  return i18nMap?.[locale.value] || plain || ''
}

const formattedDate = computed(() => {
  if (!view.value?.date) return ''
  try {
    return new Date(view.value.date).toLocaleDateString(locale.value, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return view.value.date
  }
})

/** When the forecast was read, not when the page rendered — the difference is
 *  the whole reason the timestamp travels with the number. */
const forecastRead = computed(() => {
  const at = view.value?.weather?.fetchedAt
  if (!at) return ''
  try {
    return new Date(at).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
})

const cachedWhen = computed(() => {
  if (!cachedAt.value) return ''
  try {
    return new Date(cachedAt.value).toLocaleString(locale.value)
  } catch {
    return ''
  }
})
</script>

<style scoped>
/* Built for a phone held in one hand at a venue entrance, not for a desk. */
.hub { max-width: 640px; margin: 0 auto; padding: 16px; }

.card { background: #fff; border-radius: 14px; padding: 20px; }

.head { text-align: center; margin-bottom: 20px; }
.head h1 { margin: 0 0 6px; font-size: 24px; }
.date { margin: 0; color: #6b6b6b; font-size: 14px; }
.message { margin: 10px 0 0; font-size: 15px; }

.block { margin-top: 22px; }
.block h2 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #8a8a8a; }

.announcements { display: flex; flex-direction: column; gap: 8px; }
.announcement { padding: 12px 14px; border-radius: 10px; background: #faf8f4; border-left: 3px solid #ddd8cf; }
.announcement.urgent { background: #fdeceb; border-left-color: #a3271f; }
.announcement-title { margin: 0; font-weight: 600; }
.announcement-body { margin: 4px 0 0; font-size: 14px; color: #4a4a4a; }

.weather { padding: 14px 16px; border-radius: 12px; background: #f5f7fa; }
.temps { margin: 0; font-size: 22px; font-weight: 600; }
.rain { margin: 4px 0 0; font-size: 14px; color: #4a4a4a; }
.provenance { margin: 6px 0 0; font-size: 11.5px; color: #8a8a8a; }

.table-block { padding: 16px; border-radius: 12px; background: #f3f7f1; }
.table-title { margin: 0; font-size: 26px; font-weight: 600; }
.tablemates { margin: 6px 0 0; font-size: 14px; color: #4a4a4a; }

.party { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.party li { padding: 4px 12px; border-radius: 999px; background: #faf8f4; font-size: 14px; }

.agenda { list-style: none; margin: 0; padding: 0; }
.agenda li { display: grid; grid-template-columns: 64px 1fr; gap: 4px 10px; padding: 8px 0; border-bottom: 1px solid #f0eee8; }
.agenda .time { font-variant-numeric: tabular-nums; color: var(--brand); font-weight: 600; }
.agenda .where { grid-column: 2; font-size: 13px; color: #8a8a8a; }

.place { padding: 10px 0; }
.place-name { margin: 0; font-weight: 600; }
.place-address, .place-notes { margin: 4px 0 0; font-size: 14px; color: #4a4a4a; }
.map-link { display: inline-block; margin-top: 8px; font-size: 14px; color: var(--brand); }

.contacts { list-style: none; margin: 0; padding: 0; }
.contacts li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0eee8; }

.cached { margin-top: 20px; font-size: 12px; color: #8f6d1f; text-align: center; }
.loading { text-align: center; padding: 40px 0; color: #6b6b6b; }

.refused { text-align: center; padding: 40px 16px; }
.refused h1 { font-size: 20px; margin: 0 0 8px; }
</style>
