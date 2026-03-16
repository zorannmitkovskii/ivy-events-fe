<template>
  <section class="templates" :id="id">
    <div class="wrap">
      <div class="s-head">
        <span class="eyebrow">{{ $t('home.templates.eyebrow') }}</span>
        <h2>{{ $t('home.templates.titleBefore') }} <em>{{ $t('home.templates.titleAccent') }}</em></h2>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="spinner" />
      </div>

      <InvitationGrid
        v-else
        :invitations="displayTemplates"
        :empty-message="$t('home.templates.empty', 'No templates available yet.')"
        @select="onOpenEdit"
        @preview="onOpenEdit"
      />

      <div class="tpl-cta">
        <router-link :to="resolvedCtaTo" class="btn-lg ghost">
          {{ $t('home.templates.cta') }} →
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from 'vue-i18n';
import InvitationGrid from '@/components/onboarding/InvitationGrid.vue';
import { invitationTemplateService } from '@/services/invitationTemplate.service';
import { EventCategoryEnum } from '@/enums/EventCategory';

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

const displayTemplates = computed(() => {
  const mapped = templates.value.map(t => ({
    id: t.id,
    name: t.name,
    thumbnailUrl: t.thumbnailImage || (t.path ? `/thumbnails/${t.path.split('/').pop()}.svg` : ''),
  }));
  return mapped.slice(-3).reverse();
});

onMounted(async () => {
  loading.value = true;
  try {
    const data = await invitationTemplateService.listByCategory(EventCategoryEnum.WEDDING);
    templates.value = (data || []).filter(t => t.active !== false);
  } catch (e) {
    console.warn('[TemplatesGallery] failed to load templates:', e);
  } finally {
    loading.value = false;
  }
});

function onOpenEdit(id) {
  const inv = templates.value.find(t => t.id === id);
  if (!inv?.path) return;
  router.push(`/${lang.value}/${inv.path}?edit=true`);
}
</script>

<style scoped>
.templates {
  padding: 96px 52px;
  background: var(--bg-white);
}

.wrap { max-width: 1200px; margin: 0 auto; }

.s-head { text-align: center; margin-bottom: 56px; }

.eyebrow {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-main);
  margin-bottom: 12px;
}

h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(36px, 4vw, 54px);
  font-weight: 400;
  line-height: 1.15;
  margin: 0;
  color: var(--brand-main);
}

h2 em { font-style: italic; color: var(--brand-gold); }

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--brand-gold, #c4956a);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* CTA */
.tpl-cta {
  text-align: center;
  margin-top: 36px;
}

.btn-lg {
  padding: 14px 30px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-lg.ghost {
  border: 1.5px solid var(--soft-light);
  background: #fff;
  color: var(--brand-main);
}

.btn-lg.ghost:hover {
  border-color: var(--brand-main);
}

@media (max-width: 900px) {
  .templates { padding: 64px 24px; }
}
</style>
