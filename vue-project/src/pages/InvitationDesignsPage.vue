<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <h1>{{ t('designs.title') }}</h1>
        <p class="lead">{{ t('designs.lead') }}</p>
        <div class="row">
          <router-link class="btn btn-primary" :to="{ name: 'signup', params: { lang } }">
            {{ t('header.actions.createInvitation') }}
          </router-link>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="wrap">
        <div class="filters" role="group" :aria-label="t('designs.filterLabel')">
          <button
            v-for="option in filters"
            :key="option.value"
            type="button"
            :aria-pressed="category === option.value"
            @click="category = option.value"
          >{{ option.label }}</button>
        </div>

        <div v-if="loading" class="empty">{{ t('designs.loading') }}</div>

        <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

        <div v-else-if="shown.length" class="designs">
          <article v-for="(design, i) in shown" :key="design.id" class="design">
            <div class="paper" :class="toneFor(design, i)">
              <!--
                A real thumbnail when the template has one, and the design's
                tinted card when it does not. The mockup fills every card with
                a fictional couple and date; inventing those against a real
                catalogue would put nine weddings that never happened on a page
                whose whole job is to show what is actually on offer.
              -->
              <img v-if="design.thumbnailImage" :src="design.thumbnailImage" :alt="design.name" />
              <template v-else>
                <small>{{ categoryLabel(design.eventCategory) }}</small>
                <strong>{{ design.name }}</strong>
                <span>{{ t('designs.interactiveInvitation') }}</span>
              </template>

              <router-link class="btn btn-light btn-sm" :to="previewTo(design)">
                {{ t('eventCategories.openExample') }}
              </router-link>
            </div>

            <div>
              <div class="info">
                <h3>{{ design.name }}</h3>
                <span>{{ categoryLabel(design.eventCategory) }}</span>
              </div>
              <p v-if="design.description">{{ design.description }}</p>
            </div>
          </article>
        </div>

        <p v-else class="empty">{{ t('designs.empty') }}</p>
      </div>
    </section>

    <section class="section final">
      <div class="wrap">
        <div>
          <h2>{{ t('designs.customTitle') }}</h2>
          <p>{{ t('designs.customBody') }}</p>
        </div>
        <router-link class="btn btn-gold" :to="{ name: 'contact', params: { lang } }">
          {{ t('designs.customCta') }}
        </router-link>
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SitePage from '@/layouts/SitePage.vue'
import { invitationTemplateService } from '@/services/invitationTemplate.service'
import { getErrorMessage } from '@/services/apiError'
import { categoryLabelKey } from '@/helper/CategoryMapping.helper.js'

/*
  The public catalogue — `pokani.html`.

  Distinct from `onboarding/EventInvitationsPage.vue`, which looks similar and
  is not the same screen: that one is step two of creating an event and its job
  is to set `invitationName` on the onboarding store. This one is a marketing
  page that anyone can reach from the header, and it links into the previews.
*/

const ALL = 'ALL'

/** The tint each category gets when a template has no thumbnail of its own. */
const CATEGORY_TONES = {
  WEDDING: 'tone-sage',
  BIRTHDAY: 'tone-rose',
  CORPORATE: 'tone-night',
  GRADUATION: 'tone-lav',
  BABY_SHOWER: 'tone-sky',
  ANNIVERSARY: 'tone-sand',
  CONFERENCE: 'tone-night',
  DINNER: 'tone-sun',
}

const TONE_CYCLE = ['tone-sage', 'tone-sun', 'tone-rose', 'tone-sky', 'tone-lav', 'tone-sand']

const { t } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const designs = ref([])

/* Arriving from a category card on the landing page opens the catalogue on
   that category, which is what the card promised. */
const category = ref(route.query.category || ALL)
const loading = ref(true)
const error = ref('')

/** Only the categories that actually have a template behind them. */
const filters = computed(() => {
  const present = [...new Set(designs.value.map((d) => d.eventCategory).filter(Boolean))]
  return [
    { value: ALL, label: t('designs.all') },
    ...present.map((value) => ({ value, label: categoryLabel(value) })),
  ]
})

/* A category in the URL that no template belongs to would filter the page down
   to nothing with no filter button showing as chosen — so it falls back. */
watch(
  [designs, category],
  () => {
    if (category.value !== ALL && !filters.value.some((f) => f.value === category.value)) {
      category.value = ALL
    }
  },
  { flush: 'post' },
)

const shown = computed(() =>
  category.value === ALL
    ? designs.value
    : designs.value.filter((d) => d.eventCategory === category.value),
)

function categoryLabel(value) {
  const key = categoryLabelKey(value)
  return key ? t(key) : value
}

function toneFor(design, index) {
  return CATEGORY_TONES[design.eventCategory] || TONE_CYCLE[index % TONE_CYCLE.length]
}

/**
 * The template's own preview.
 *
 * `path` is stored as the whole route tail — `invitations/olive-grove` — not
 * as a bare slug, which is how the onboarding screen already resolves it. So
 * it is joined onto the language prefix rather than fed to a named route.
 */
function previewTo(design) {
  return `/${lang.value}/${design.path}`
}

onMounted(async () => {
  try {
    const response = await invitationTemplateService.listAllActive()
    designs.value = response?.data ?? response ?? []
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* `.page-hero`, `.filters`, `.designs`, `.design` and the seven tones are the
   design's, in `ivy/site.css`. The thumbnail is what the mockup has no version
   of — its cards are all drawn, ours can carry a real image. */
.design .paper img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
