<template>
  <section class="wt-section">
    <div class="wt-inner">

      <!-- Title block -->
      <div class="wt-header">
        <h1 class="wt-title">Wedding Invitation Templates</h1>
        <p class="wt-sub">
          Choose from our curated collection of elegant wedding invitations. Customize each design to match your special day.
        </p>
      </div>

      <!-- Filters -->
      <div class="wt-filters" role="tablist" aria-label="Template categories">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="['filter-btn', activeCategory === cat ? 'active' : '']"
          @click="setCategory(cat)"
          :aria-pressed="activeCategory === cat ? 'true' : 'false'"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Grid -->
      <div class="wt-grid">
        <article
          v-for="(t, idx) in filtered"
          :key="t.title + idx"
          class="wt-card"
          @click="selectTemplate(t)"
          role="button"
          tabindex="0"
          @keyup.enter="selectTemplate(t)"
        >
          <div class="wt-thumb">
            <img :src="t.image" :alt="t.title" />
          </div>

          <div class="wt-card-body">
            <h3 class="card-title">{{ t.title }}</h3>
            <p class="card-sub">{{ t.subtitle }}</p>
          </div>
        </article>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

/*
  This component follows your provided HTML and screenshot:
  - mint background
  - centered title + subtitle
  - filter buttons row, active highlighted in green
  - responsive grid: 1 / 2 / 3 / 4 columns (mobile -> desktop)
  - rounded cards with image and text; hover lift + subtle shadow
  - emits 'select' when user clicks a template (so parent can open modal)
*/

const categories = [
  'All Templates',
  'Weddings',
  'Business',
  'Birthday',
  'Concerts',
  'Private Parties'
]

const activeCategory = ref('Weddings') // matches screenshot highlight on Weddings

const templates = ref([
  {
    title: 'Elegant Garden',
    subtitle: 'Classic & Timeless',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Beach Romance',
    subtitle: 'Coastal & Breezy',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Rustic Charm',
    subtitle: 'Country & Warm',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Modern Minimalist',
    subtitle: 'Clean & Contemporary',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Vineyard Elegance',
    subtitle: 'Sophisticated & Refined',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Royal Castle',
    subtitle: 'Grand & Majestic',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Floral Dream',
    subtitle: 'Romantic & Delicate',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800&h=1000&fit=crop&q=80'
  },
  {
    title: 'Sunset Glow',
    subtitle: 'Warm & Intimate',
    category: 'Weddings',
    image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&h=1000&fit=crop&q=80'
  }
])

const setCategory = (c) => {
  activeCategory.value = c
}

const filtered = computed(() => {
  if (activeCategory.value === 'All Templates') return templates.value
  return templates.value.filter(t => t.category === activeCategory.value)
})

// emit event for parent to show modal/preview
const emit = defineEmits(['select'])
const selectTemplate = (template) => {
  emit('select', template)
}
</script>

<style scoped>
/* container + background */
.wt-section {
  background: #F1F7F3; /* mint background from screenshot */
  padding: 3rem 0;
}

.wt-inner {
  max-width: 1200px; /* keeps layout centered like screenshot */
  margin: 0 auto;
  padding: 0 20px;
}

/* header */
.wt-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.wt-title {
  font-size: 2rem;
  line-height: 1.05;
  margin: 0 0 0.5rem;
  font-weight: 800;
  color: #0f1720; /* deep neutral */
}

.wt-sub {
  color: #6B6F6B;
  max-width: 820px;
  margin: 0 auto;
  font-size: 1rem;
}

/* filters row */
.wt-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
  margin: 1.75rem 0 2.25rem;
}

.filter-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #E6ECE6;
  color: #3D4A3D;
  font-weight: 600;
  cursor: pointer;
  transition: all 180ms ease;
  box-shadow: 0 1px 0 rgba(0,0,0,0.02);
}
.filter-btn:hover {
  transform: translateY(-2px);
  background: #fbfbfb;
}
.filter-btn.active {
  background: #43A57D; /* brand green */
  color: white;
  box-shadow: 0 6px 18px rgba(67,165,125,0.12);
  border-color: rgba(67,165,125,0.15);
}

/* grid */
.wt-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr); /* mobile first */
  gap: 20px;
}

/* medium screens */
@media (min-width: 600px) {
  .wt-grid { grid-template-columns: repeat(2, 1fr); }
}

/* large tablets / small desktop */
@media (min-width: 900px) {
  .wt-grid { grid-template-columns: repeat(3, 1fr); }
}

/* desktop wide */
@media (min-width: 1200px) {
  .wt-grid { grid-template-columns: repeat(4, 1fr); }
}

/* card */
.wt-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 6px 20px rgba(14, 20, 14, 0.03);
  transition: transform .18s ease, box-shadow .18s ease;
  cursor: pointer;
  outline: none;
}
.wt-card:focus {
  box-shadow: 0 8px 26px rgba(67,165,125,0.14);
  transform: translateY(-6px);
}

/* image */
.wt-thumb {
  width: 100%;
  height: 18.5rem; /* consistent height */
  overflow: hidden;
  background: #f7faf7;
}
.wt-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .4s ease;
}
.wt-card:hover .wt-thumb img {
  transform: scale(1.03);
}

/* body */
.wt-card-body {
  padding: 1.05rem 1rem;
}
.card-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  color: #0f1720;
}
.card-sub {
  margin: 0.35rem 0 0;
  color: #6B6F6B;
  font-size: 0.9rem;
}

/* small tweaks */
@media (max-width: 420px) {
  .wt-title { font-size: 1.5rem; }
  .wt-thumb { height: 14.5rem; }
  .filter-btn { padding: 0.5rem .9rem; font-size: .95rem; }
}
</style>
