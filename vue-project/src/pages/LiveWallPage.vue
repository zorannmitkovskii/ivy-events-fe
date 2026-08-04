<template>
  <!-- Runs on a screen at the venue for hours with nobody watching the browser.
       No chrome, no navigation, nothing to click by accident. -->
  <div class="wall">
    <transition-group name="tile" tag="div" class="grid">
      <article v-for="item in items" :key="item.id" class="tile" :class="tileClass(item)">
        <img v-if="isImage(item)" :src="mediaSrc(item)" :alt="item.authorName || ''" />
        <p v-else-if="item.type === 'MUSIC_REQUEST'" class="song">♪ {{ item.text }}</p>
        <p v-else class="message">{{ item.text }}</p>
        <p v-if="item.authorName" class="author">— {{ item.authorName }}</p>
      </article>
    </transition-group>

    <p v-if="!items.length" class="waiting">{{ t('wall.waiting') }}</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { contributionsService } from '@/services/contributions.service'
import { baseUrl } from '@/services/baseUrl'

/**
 * How often the wall asks for new items.
 *
 * Polling rather than a socket: this screen runs for six hours on venue wifi
 * that drops, and a poll that misses one round recovers by itself. A socket
 * that silently dies leaves a frozen wall nobody notices until the speeches.
 */
const REFRESH_MS = 15_000

const { t } = useI18n()
const route = useRoute()

const items = ref([])
let timer = null

const eventId = route.query.event || route.params.eventId

onMounted(() => {
  refresh()
  timer = setInterval(refresh, REFRESH_MS)
})

onBeforeUnmount(() => clearInterval(timer))

async function refresh() {
  if (!eventId) return
  try {
    const response = await contributionsService.wall(eventId)
    items.value = response?.data ?? response ?? []
  } catch {
    // A dropped request leaves the last good wall on screen. Blanking a
    // projector because one poll failed is the worse outcome by far.
  }
}

function isImage(item) {
  return item.type === 'PHOTO'
}

function mediaSrc(item) {
  return `${baseUrl}/v1/api/public/images/${encodeURIComponent(item.mediaKey)}`
}

/** Photos get more room than a one-line song request. */
function tileClass(item) {
  return {
    'tile-media': item.type === 'PHOTO' || item.type === 'VIDEO',
    'tile-song': item.type === 'MUSIC_REQUEST',
  }
}
</script>

<style scoped>
.wall {
  min-height: 100vh;
  background: #14110e;
  color: #f7f3ec;
  padding: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.tile {
  background: #1e1a16;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tile-media { padding: 0; overflow: hidden; }
.tile-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tile-media .author { padding: 10px 16px 14px; }

.message { margin: 0; font-size: 20px; line-height: 1.4; }
.song { margin: 0; font-size: 20px; color: #d8c48a; }
.author { margin: 0; font-size: 14px; color: #a09585; }

.waiting {
  text-align: center;
  padding: 80px 0;
  font-size: 18px;
  color: #6f665c;
}

/* Enough to notice something new arrived, not enough to distract from a
   speech. */
.tile-enter-active { transition: opacity 600ms ease, transform 600ms ease; }
.tile-enter-from { opacity: 0; transform: translateY(12px); }
</style>
