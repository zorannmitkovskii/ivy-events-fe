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

          The mockup draws every card as a live link because it has no back end
          to disagree with. Which categories are open is the server's to say
          (`available` on the card), and a card promising "open the example"
          for a category that is not built yet is worse than "coming soon".
        -->
        <component
          :is="cat.disabled ? 'span' : 'button'"
          v-for="cat in cards"
          :key="cat.id"
          :type="cat.disabled ? null : 'button'"
          class="cat"
          :class="[cat.tint, { active: cat.id === selectedId, disabled: cat.disabled }]"
          :aria-disabled="cat.disabled ? 'true' : null"
          @click="!cat.disabled && onSelect(cat.id)"
        >
          <span v-if="cat.featured" class="badge-gold">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3l-6.1 3.3 1.4-6.8L2.2 9.1l6.9-.8Z" />
            </svg>{{ $t('eventCategories.mostPopular') }}
          </span>

          <span class="type">{{ cat.title }}</span>
          <span class="title">{{ cat.sample }}</span>
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
import { useI18n } from 'vue-i18n'
import { useEventCategories } from '@/composables/usePublicCatalog'
import { ENUM_TO_CATEGORY_ID, categoryLabelKey } from '@/helper/CategoryMapping.helper.js'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  showHeader: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const allDesignsTo = computed(() => ({ name: 'designs', params: { lang: lang.value } }))

const selectedId = computed(() => props.modelValue)

function onSelect(id) {
  emit('update:modelValue', id)
}

/*
  The cards come from the server (`GET /public/event-categories`): their order,
  tint, which one carries the "most popular" badge, whether the category is
  open yet, and the sample event name in each language. Only the category's
  own name is the front end's, from the same translation every other screen
  uses for it.
*/
const { categories, load } = useEventCategories()
load()

/** The sample in the page's language; Macedonian when that one is missing. */
function sampleFor(sample) {
  return sample?.[locale.value] || sample?.mk || ''
}

const cards = computed(() =>
  categories.value.map((card) => {
    const labelKey = categoryLabelKey(card.category)
    return {
      id: ENUM_TO_CATEGORY_ID[card.category] ?? card.category,
      tint: card.tint || '',
      title: labelKey ? t(labelKey) : card.category,
      sample: sampleFor(card.sample),
      featured: card.featured,
      disabled: !card.available,
    }
  }),
)
</script>

<style scoped>
/* `.cats`, `.cat` and the four tints are the design's, in `ivy/site.css`.
   What is here is only what the mockup had no need for: a card can be a
   button, and one the server has not opened yet is not clickable. */
/* The design starts the categories flush under the hero carousel and ends
   them with a full section's padding on top of the next section's own. */
.ivy-site .cats {
  padding-top: clamp(56px, 7vw, 96px);
  padding-bottom: clamp(32px, 4vw, 56px);
}

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
