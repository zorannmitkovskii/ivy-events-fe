<template>
  <section
    class="hero hc"
    id="top"
    :class="{ paused }"
    :data-tone="current.tone"
    aria-roledescription="carousel"
    :aria-label="$t('home.hero.carouselLabel')"
    @mouseenter="paused = true"
    @mouseleave="onLeave"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div class="hc-index" aria-hidden="true">IVY—<span>{{ padded(index + 1) }}</span></div>

    <div class="wrap">
      <div class="hc-copy">
        <div
          v-for="(slide, i) in SLIDES"
          :key="slide.kind"
          class="hc-slide"
          :class="{ active: i === index }"
          :data-kind="slide.kind"
          :data-tone="slide.tone"
          :aria-hidden="i === index ? null : 'true'"
        >
          <p class="hc-tag">{{ $t(`home.hero.slides.${slide.kind}.tag`) }} · {{ padded(i + 1) }}</p>
          <h1>{{ $t(`home.hero.slides.${slide.kind}.title`) }}</h1>
          <p class="lead">{{ $t(`home.hero.slides.${slide.kind}.lead`) }}</p>
          <div class="hero-cta">
            <router-link class="btn btn-primary" :to="demoTo(slide.kind)" :tabindex="i === index ? null : -1">
              {{ $t('home.hero.openInvitation') }}
            </router-link>
            <router-link class="btn btn-ghost" :to="designsTo" :tabindex="i === index ? null : -1">
              {{ $t('home.hero.seeCategory') }}
            </router-link>
          </div>
        </div>

        <div class="hero-trust" :aria-label="$t('home.hero.trustLabel')">
          <span v-for="item in TRUST" :key="item">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m3 8.5 3 3 7-7" />
            </svg>{{ $t(item) }}
          </span>
        </div>
      </div>

      <div class="hc-stage">
        <!--
          A card the deck has not brought to the front is not a link yet — the
          first press turns it, the second opens it. Without that a thumbnail
          three-quarters hidden behind two others is a navigation trap.
        -->
        <router-link
          v-for="(slide, i) in SLIDES"
          :key="slide.kind"
          class="hc-card"
          :class="[`tone-${slide.tone}`, deckClass(i)]"
          :to="demoTo(slide.kind)"
          :tabindex="i === index ? null : -1"
          :aria-label="$t('home.hero.openCategory', { name: $t(`home.hero.slides.${slide.kind}.tag`) })"
          @click="onCardClick($event, i)"
        >
          <small>{{ $t(`home.hero.slides.${slide.kind}.tag`) }}</small>
          <strong>
            {{ $t(`home.hero.slides.${slide.kind}.cardLead`) }}
            <em>{{ $t(`home.hero.slides.${slide.kind}.cardAccent`) }}</em>
            {{ $t(`home.hero.slides.${slide.kind}.cardTrail`) }}
          </strong>
          <svg class="vine" viewBox="0 0 64 22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <path d="M2 12c10-8 18 8 30 0s18-8 30 0" />
            <path d="M16 9c2-4 5-4 6 0-2 3-5 3-6 0Zm26 4c1 4 4 4 6 0-2-3-5-3-6 0Z" fill="currentColor" stroke="none" />
          </svg>
          <span>
            {{ $t(`home.hero.slides.${slide.kind}.date`) }}<br />{{ $t(`home.hero.slides.${slide.kind}.place`) }}
          </span>
          <b>{{ $t('home.hero.seeDemo') }}</b>
        </router-link>
      </div>
    </div>

    <div class="hc-controls wrap">
      <button type="button" class="hc-arrow" :aria-label="$t('home.hero.previous')" @click="go(index - 1)">←</button>

      <div role="tablist" :aria-label="$t('home.hero.carouselLabel')">
        <button
          v-for="(slide, i) in SLIDES"
          :key="slide.kind"
          type="button"
          role="tab"
          :aria-selected="i === index"
          :tabindex="i === index ? 0 : -1"
          @click="go(i)"
          @keydown="onTabKeydown"
        >
          <span>{{ padded(i + 1) }}</span>
          <small>{{ $t(`home.hero.slides.${slide.kind}.short`) }}</small>
          <i></i>
        </button>
      </div>

      <button type="button" class="hc-arrow" :aria-label="$t('home.hero.next')" @click="go(index + 1)">→</button>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

/*
  The home page's opening: five categories on a turning card deck.

  It replaces the single invitation-and-RSVP hero. The RSVP demo it used to
  carry is not lost — it moved into the guest-experience section, where three
  phones show the whole thing an invited person actually sees.
*/

const ADVANCE_MS = 6500
const SWIPE_PX = 50

const SLIDES = [
  { kind: 'wedding', tone: 'sage' },
  { kind: 'birthday', tone: 'rose' },
  { kind: 'corporate', tone: 'night' },
  { kind: 'graduation', tone: 'lav' },
  { kind: 'baby', tone: 'sky' },
]

const TRUST = ['home.hero.trustFree', 'home.hero.trustNoApp', 'home.hero.trustBilingual']

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const index = ref(0)
const paused = ref(false)
const current = computed(() => SLIDES[index.value])

const designsTo = computed(() => ({ name: 'designs', params: { lang: lang.value } }))
const demoTo = (kind) => `/${lang.value}/invitations/demo-${kind}`

const padded = (n) => String(n).padStart(2, '0')

/** Which of the three visible positions a card is in, if any. */
function deckClass(i) {
  const n = SLIDES.length
  if (i === index.value) return 'is-active'
  if (i === (index.value - 1 + n) % n) return 'is-prev'
  if (i === (index.value + 1) % n) return 'is-next'
  return ''
}

let timer = null

function go(next) {
  index.value = (next + SLIDES.length) % SLIDES.length
  restart()
}

function restart() {
  clearInterval(timer)
  if (!paused.value) timer = setInterval(() => go(index.value + 1), ADVANCE_MS)
}

function onLeave() {
  if (prefersReducedMotion()) return
  paused.value = false
  restart()
}

function onCardClick(event, i) {
  if (i === index.value) return
  event.preventDefault()
  go(i)
}

/** Arrow keys move between tabs, which is what `role="tablist"` promises. */
function onTabKeydown(event) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  go(index.value + step)
  event.currentTarget.parentElement.children[index.value]?.focus()
}

let touchX = 0
const onTouchStart = (e) => {
  touchX = e.touches[0].clientX
}
const onTouchEnd = (e) => {
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dx) > SWIPE_PX) go(index.value + (dx < 0 ? 1 : -1))
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

onMounted(() => {
  // A carousel that advances on its own is the clearest case there is for
  // honouring this: it moves the thing somebody is in the middle of reading.
  if (prefersReducedMotion()) {
    paused.value = true
    return
  }
  restart()
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
/*
  The controls row carries `wrap` for its width and gutters, which also makes it
  match `.hc .wrap` — the two-column grid that lays out the copy beside the card
  deck. That rule scores (0,3,0) against the sheet's own `.hc-controls` at
  (0,2,0), so the row silently becomes a grid: the two arrows stack in the left
  column and the tabs land in the right one, on top of the cards.

  The mockup renders it that way too, so this is not a port error — but every
  declaration on `.hc-controls` (a flex row, 14px apart, arrows at either end)
  says what was meant, and the collision is what arrived. Restated here, through
  `.hero` as well, so it outscores the grid instead of tying with it.
*/
.hero.hc .hc-controls {
  display: flex;
  gap: 14px;
}
</style>
