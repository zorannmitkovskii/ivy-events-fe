<template>
  <section class="planner section" id="planer" aria-labelledby="planner-title">
    <div class="wrap">
      <div>
        <div class="section-head" style="margin-bottom: 0">
          <h2 id="planner-title">{{ $t('home.planner.title') }}</h2>
          <p>{{ $t('home.planner.subtitle') }}</p>
        </div>

        <div class="tabs" role="tablist" :aria-label="$t('home.planner.tablistLabel')">
          <button
            v-for="tab in tabs"
            :id="`t-${tab.key}`"
            :key="tab.key"
            class="tab"
            type="button"
            role="tab"
            :aria-selected="active === tab.key"
            :aria-controls="`p-${tab.key}`"
            :tabindex="active === tab.key ? 0 : -1"
            @click="active = tab.key"
            @keydown="onTabKeydown"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" v-html="tab.icon"></svg>
            <span>
              <b>{{ $t(`home.planner.tabs.${tab.key}.title`) }}</b>
              <span>{{ $t(`home.planner.tabs.${tab.key}.hint`) }}</span>
            </span>
          </button>
        </div>
      </div>

      <div class="panel-wrap">
        <!-- Guests -->
        <div
          id="p-guests"
          class="panel"
          :class="{ active: active === 'guests' }"
          role="tabpanel"
          aria-labelledby="t-guests"
        >
          <div class="panel-head">
            <b>{{ $t('home.planner.tabs.guests.title') }}</b>
            <span>{{ $t('home.planner.guests.summary', guestCounts) }}</span>
          </div>
          <div class="grow">
            <div v-for="g in sampleGuests" :key="g.key" class="r">
              <span class="av">{{ initials($t(`home.planner.guests.names.${g.key}`)) }}</span>
              <div>
                <b>{{ $t(`home.planner.guests.names.${g.key}`) }}</b>
                <small>{{ $t(`home.planner.guests.rows.${g.key}`) }}</small>
              </div>
              <span class="chip" :class="CHIP_FOR[g.status]">{{ $t(`guestStatus.${g.status}`) }}</span>
            </div>
          </div>
        </div>

        <!-- Tables -->
        <div
          id="p-tables"
          class="panel"
          :class="{ active: active === 'tables' }"
          role="tabpanel"
          aria-labelledby="t-tables"
        >
          <div class="panel-head">
            <b>{{ $t('home.planner.tabs.tables.title') }}</b>
            <span>{{ $t('home.planner.tables.summary') }}</span>
          </div>
          <div class="tables">
            <div v-for="table in sampleTables" :key="table.labelKey" class="table">
              <span>
                <b>{{ $t(table.labelKey) }}</b>
                <small>{{ $t(table.groupKey) }}</small>
              </span>
              <i
                v-for="(seat, i) in SEAT_POSITIONS"
                :key="i"
                class="seat"
                :class="{ e: table.free.includes(i) }"
                :style="seat"
              ></i>
            </div>
          </div>
          <p class="small muted" style="margin-top: 16px">{{ $t('home.planner.tables.legend') }}</p>
        </div>

        <!-- Budget -->
        <div
          id="p-budget"
          class="panel budget"
          :class="{ active: active === 'budget' }"
          role="tabpanel"
          aria-labelledby="t-budget"
        >
          <div class="panel-head">
            <b>{{ $t('home.planner.tabs.budget.title') }}</b>
            <span>{{ $t('home.planner.budget.summary', { percent: BUDGET_SPENT_PERCENT }) }}</span>
          </div>
          <div class="bar"><i :style="{ width: `${BUDGET_SPENT_PERCENT}%` }"></i></div>
          <div v-for="line in sampleBudget" :key="line.labelKey" class="line">
            <span>{{ $t(line.labelKey) }}</span>
            <b>{{ $t(line.stateKey) }}</b>
          </div>
          <p class="small muted" style="margin-top: 14px">{{ $t('home.planner.budget.note') }}</p>
        </div>

        <!-- Gallery -->
        <div
          id="p-gallery"
          class="panel"
          :class="{ active: active === 'gallery' }"
          role="tabpanel"
          aria-labelledby="t-gallery"
        >
          <div class="panel-head">
            <b>{{ $t('home.planner.tabs.gallery.title') }}</b>
            <span>{{ $t('home.planner.gallery.summary') }}</span>
          </div>
          <div class="gallery">
            <GalleryTile
              v-for="n in GALLERY_TILES - 1"
              :key="n"
              :index="n - 1"
              :src="GALLERY_PHOTOS[n - 1] || ''"
              :alt="$t('home.planner.gallery.photoAlt')"
            />
            <div class="more">+{{ GALLERY_REMAINING }}</div>
          </div>
          <div class="gal-meta">
            <span>{{ $t('home.planner.gallery.privateLink') }}</span>
            <span>{{ $t('home.planner.gallery.youApprove') }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import GalleryTile from '@/components/landingPage/GalleryTile.vue'

/*
  What the product does after the invitation is sent, shown rather than listed.

  This replaces the four feature cards that used to sit here. The sample data
  is deliberately fixed and local: it is a screenshot drawn in HTML, not a
  preview of the viewer's own event, and pulling a real event in would mean a
  signed-out landing page waiting on an API call to render its middle.
*/

const BUDGET_SPENT_PERCENT = 68
const GALLERY_TILES = 8
const GALLERY_REMAINING = 206

/*
  Real photographs for the gallery tab, when there are any.

  Empty on purpose. Every free source reachable from here either serves
  identifiable people under a licence that forbids commercial use — LoremFlickr
  returned cc-nc-nd and cc-sa, with the licence code and the photographer's
  name burned into the pixels — or serves a random catalogue with no wedding in
  it. Drop files into `public/demo/gallery` and list them here; each one
  replaces a drawing, and the drawings cover whatever is left.

  See `public/demo/gallery/README.md`.
*/
const GALLERY_PHOTOS = []

/** Six seats around the circle, in the order the design places them. */
const SEAT_POSITIONS = [
  { top: '-6px', left: '50%' },
  { right: '6px', top: '22%' },
  { right: '6px', bottom: '22%' },
  { bottom: '-6px', left: '50%' },
  { left: '6px', bottom: '22%' },
  { left: '6px', top: '22%' },
]

const active = ref('guests')

const tabs = [
  {
    key: 'guests',
    icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 3.5 6.5"/>',
  },
  {
    key: 'tables',
    icon: '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="3.5" r="1.5"/><circle cx="12" cy="20.5" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="20.5" cy="12" r="1.5"/>',
  },
  {
    key: 'budget',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  },
  {
    key: 'gallery',
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/>',
  },
]

/*
  The four states a guest is actually in — `InviteStatus` on the backend, not a
  set invented for the mockup. The pair that gets confused is INVITED and
  PENDING: INVITED means the invitation went out and no answer has come back,
  PENDING means they are on the list and have not been asked yet. A landing
  page that showed three states would be teaching people a model the product
  does not have.
*/
const CHIP_FOR = {
  CONFIRMED: 'ok',
  INVITED: 'wait',
  DECLINED: 'no',
  PENDING: '',
}

/*
  The key names both the guest and their note — `home.planner.guests.names.*`
  and `.rows.*` — so a row is one word here rather than a name in one script
  and a message path in another.
*/
const sampleGuests = [
  { key: 'vegetarian', status: 'CONFIRMED' },
  { key: 'airport', status: 'CONFIRMED' },
  { key: 'withChild', status: 'INVITED' },
  { key: 'watchingOnline', status: 'DECLINED' },
  { key: 'nutAllergy', status: 'PENDING' },
]

/*
  The summary above the list, counted the way the backend counts it:
  `invited` is everyone who was actually asked — confirmed + awaiting + declined
  — which is the denominator of a response rate. Somebody still PENDING has not
  been asked, so they are not in it.
*/
const guestCounts = {
  invited: 118,
  confirmed: 73,
  awaitingReply: 9,
}

const sampleTables = [
  { labelKey: 'home.planner.tables.one', groupKey: 'home.planner.tables.family', free: [] },
  { labelKey: 'home.planner.tables.two', groupKey: 'home.planner.tables.friends', free: [2] },
  { labelKey: 'home.planner.tables.three', groupKey: 'home.planner.tables.colleagues', free: [1, 2] },
]

const sampleBudget = [
  { labelKey: 'home.planner.budget.rows.venue', stateKey: 'home.planner.budget.state.deposit' },
  { labelKey: 'home.planner.budget.rows.photographer', stateKey: 'home.planner.budget.state.agreed' },
  { labelKey: 'home.planner.budget.rows.music', stateKey: 'home.planner.budget.state.awaitingQuote' },
  { labelKey: 'home.planner.budget.rows.decor', stateKey: 'home.planner.budget.state.open' },
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

/**
 * Arrow keys move between tabs, which is what `role="tablist"` promises. The
 * mockup's tabs are click-only; a roving tabindex plus this is the difference
 * between the ARIA role being true and being decoration.
 */
function onTabKeydown(event) {
  const order = tabs.map((t) => t.key)
  const at = order.indexOf(active.value)
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return

  event.preventDefault()
  active.value = order[(at + step + order.length) % order.length]
  document.getElementById(`t-${active.value}`)?.focus()
}
</script>
