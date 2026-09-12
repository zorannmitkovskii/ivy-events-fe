<template>
  <section class="cats" id="pokani">
    <div class="wrap">
      <div v-if="showHeader" class="cats-head">
        <div class="section-head" style="margin: 0">
          <h2>{{ $t('eventCategories.section.title') }}</h2>
          <p>{{ $t('eventCategories.section.subtitle') }}</p>
        </div>
        <router-link class="btn btn-ghost btn-sm" :to="allDesignsTo">
          {{ $t('eventCategories.allDesigns') }}
        </router-link>
      </div>

      <div class="cats-grid">
        <!--
          A card that can be chosen is a button: it used to be a div with a
          click handler, which no keyboard can reach. One that cannot be chosen
          is not a control at all, so it stays a span and says so.

          The mockup draws all five as live links because it has no back end to
          disagree with. Here four of the five categories are not built yet, and
          a card promising "open the example" for a category that does not exist
          is worse than a card that says "coming soon".
        -->
        <component
          :is="cat.disabled ? 'span' : 'button'"
          v-for="cat in categories"
          :key="cat.id"
          :type="cat.disabled ? null : 'button'"
          class="cat"
          :class="[cat.tint, { active: cat.id === selectedId, disabled: cat.disabled }]"
          :aria-disabled="cat.disabled ? 'true' : null"
          @click="!cat.disabled && onSelect(cat.id)"
        >
          <span v-if="cat.badgeKey" class="badge-gold">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3l-6.1 3.3 1.4-6.8L2.2 9.1l6.9-.8Z" />
            </svg>{{ $t(cat.badgeKey) }}
          </span>

          <span class="type">{{ $t(cat.titleKey) }}</span>
          <span class="title">{{ $t(cat.sampleKey) }}</span>
          <span class="open">{{ cat.disabled ? $t('eventCategories.comingSoon') : $t('eventCategories.openExample') }}</span>

          <svg class="leaf" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M16 29C16 18 10 14 3 12c5-1 9 0 12 3-1-5-2-9 1-13 3 4 2 8 1 13 3-3 7-4 12-3-7 2-13 6-13 17Z"
              fill="currentColor"
            />
          </svg>
        </component>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  showHeader: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const allDesignsTo = computed(() => ({ name: 'designs', params: { lang: lang.value } }))

const selectedId = computed(() => props.modelValue)

function onSelect(id) {
  emit('update:modelValue', id)
}

/*
  Five cards, each a tint from the redesign's category palette. The gold badge
  sits on the wedding card rather than on the birthday one the mockup marks:
  weddings are the category that actually ships, and "most popular" on a
  coming-soon card is an odd thing to claim.
*/
const categories = [
  {
    id: 'weddings',
    tint: '',
    titleKey: 'eventCategories.items.weddings.title',
    sampleKey: 'eventCategories.items.weddings.sample',
    badgeKey: 'eventCategories.mostPopular',
  },
  {
    id: 'birthdays',
    tint: 'rose',
    titleKey: 'eventCategories.items.birthdaysParties.title',
    sampleKey: 'eventCategories.items.birthdaysParties.sample',
    disabled: true,
  },
  {
    id: 'corporate',
    tint: 'night',
    titleKey: 'eventCategories.items.corporate.title',
    sampleKey: 'eventCategories.items.corporate.sample',
    disabled: true,
  },
  {
    id: 'graduations',
    tint: 'lav',
    titleKey: 'eventCategories.items.graduations.title',
    sampleKey: 'eventCategories.items.graduations.sample',
    disabled: true,
  },
  {
    id: 'baby',
    tint: 'sky',
    titleKey: 'eventCategories.items.babyShowers.title',
    sampleKey: 'eventCategories.items.babyShowers.sample',
    disabled: true,
  },
]
</script>

<style scoped>
/* `.cats`, `.cat` and the four tints are the design's, in `ivy/site.css`.
   What is here is only what the mockup had no need for: a card can be a
   button, and four of the five are not clickable yet. */
.cat {
  border: 0;
  font: inherit;
  text-align: left;
}

.cat.disabled {
  cursor: default;
  opacity: 0.72;
}

.cat.disabled:hover {
  transform: none;
  box-shadow: none;
}

.cat.disabled .open::after {
  display: none;
}
</style>
