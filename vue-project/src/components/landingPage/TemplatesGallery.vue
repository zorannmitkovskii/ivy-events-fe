<template>
  <section class="designs" :id="id">
    <div class="title reveal">
      <div>
        <p class="tag">{{ $t('home.templates.eyebrow') }}</p>
        <h2>
          {{ $t('home.templates.titleBefore') }}<br>
          <em>{{ $t('home.templates.titleAccent') }}</em>
        </h2>
      </div>
      <router-link :to="resolvedCtaTo" class="link">
        {{ $t('home.templates.cta') }} ↗
      </router-link>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="spinner" />
    </div>

    <p v-else-if="!cards.length" class="empty">
      {{ $t('home.templates.empty', 'No templates available yet.') }}
    </p>

    <div v-else class="cardgrid">
      <a
        v-for="(card, i) in cards"
        :key="card.id"
        class="card reveal"
        :class="card.tone"
        :href="card.href"
        :style="{ transitionDelay: `${i * 120}ms` }"
        @click.prevent="open(card)"
      >
        <div class="paper" :style="card.artStyle">
          <template v-if="!card.thumbnailUrl">
            <small>{{ $t('home.templates.paperLabel') }}</small>
            <strong>{{ card.sampleNames }}</strong>
            <span>{{ $t('home.templates.paperDate') }}</span>
          </template>
        </div>
        <h3>
          {{ card.name }}
          <button type="button" tabindex="-1" aria-hidden="true">↗</button>
        </h3>
        <p>{{ $t('home.templates.cardCaption') }}</p>
      </a>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { invitationTemplateService } from "@/services/invitationTemplate.service";
import { EventCategoryEnum } from "@/enums/EventCategory";
import { observeReveals, useReveal } from "@/composables/useReveal";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");

const props = defineProps({
  id: { type: String, default: "templates" },
  ctaTo: { type: [String, Object], default: null }
});

const resolvedCtaTo = computed(() =>
  props.ctaTo || { name: 'EventInvitationsPage', params: { lang: lang.value } }
);

const templates = ref([]);
const loading = ref(false);

/*
  The three grounds the redesign cycles through — sage, sun, night. They are a
  property of the position in the row, not of the template: the section is
  three cards wide and the design wants those three to be visibly different
  from each other.
*/
const TONES = ["sage", "sun", "night"];

/* The sample couple printed on a card that has no thumbnail. These three are
   already translated — they were the captions on the old template cards. */
const SAMPLE_NAME_KEYS = [
  "home.templates.items.elegantWedding.cardNames",
  "home.templates.items.birthday.cardNames",
  "home.templates.items.corporate.cardNames",
];

/*
  The mock draws its own invitation on each card, in type. A real template has
  a thumbnail, and showing the actual design beats showing a stand-in of it —
  so the thumbnail becomes the card art when there is one, and the typographic
  paper is what a template without a thumbnail falls back to.
*/
const cards = computed(() =>
  templates.value.slice(-3).reverse().map((tpl, i) => {
    const thumbnailUrl =
      tpl.thumbnailImage || (tpl.path ? `/thumbnails/${tpl.path.split("/").pop()}.svg` : "");
    return {
      id: tpl.id,
      name: tpl.name,
      path: tpl.path,
      tone: TONES[i % TONES.length],
      thumbnailUrl,
      sampleNames: t(SAMPLE_NAME_KEYS[i % SAMPLE_NAME_KEYS.length]),
      href: tpl.path ? `/${lang.value}/${tpl.path}` : "#",
      artStyle: thumbnailUrl
        ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
        : undefined,
    };
  })
);

onMounted(async () => {
  loading.value = true;
  try {
    const data = await invitationTemplateService.listByCategory(EventCategoryEnum.WEDDING);
    templates.value = (data || []).filter(tpl => tpl.active !== false);
  } catch (e) {
    console.warn('[TemplatesGallery] failed to load templates:', e);
  } finally {
    loading.value = false;
    // The cards arrive after the page-level observer has already swept, so
    // without this they would sit at opacity 0 forever.
    await nextTick();
    observeReveals();
  }
});

useReveal();

function open(card) {
  if (!card.path) return;
  router.push(`/${lang.value}/${card.path}?edit=true`);
}
</script>

<style scoped>
.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(23, 55, 43, 0.12);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty {
  font: 15px/1.8 var(--font-display);
  color: var(--ink-3);
}
</style>
