<template>
  <div class="dds" data-testid="discard-scope">
    <p class="dds__lead">{{ t('onboarding.category.draft.discard.lead') }}</p>
    <ul class="dds__list" data-testid="discard-scope-deleted">
      <li v-for="line in deleted" :key="line">{{ line }}</li>
    </ul>
    <p class="dds__lead">{{ t('onboarding.category.draft.discard.keepLead') }}</p>
    <ul class="dds__list dds__list--keep" data-testid="discard-scope-kept">
      <li>{{ loggedIn ? t('onboarding.category.draft.discard.keepAccount') : t('onboarding.category.draft.discard.keepGuest') }}</li>
    </ul>
    <p class="dds__warn">{{ t('onboarding.category.draft.discard.irreversible') }}</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { categoryLabelKey } from "@/helper/CategoryMapping.helper.js";
import { formatCalendarDate } from "@/utils/creationDraft";
import { BUILDER_DESIGN_ID, designName } from "@/utils/designSwitch";

/**
 * Exactly what discarding the draft on this device deletes, and what it does
 * not (INV-302). Built from `findResumableDraft`, so it names only what is
 * really there — the person's own entries, not a design's examples.
 */
const props = defineProps({
  draft: { type: Object, default: null },
  loggedIn: { type: Boolean, default: false },
});

const { t, locale } = useI18n();

const deleted = computed(() => {
  const d = props.draft;
  if (!d) return [t("onboarding.category.draft.discard.generic")];
  const lines = [];

  const key = categoryLabelKey(d.category);
  const summary = [
    d.category ? (key ? t(key) : d.category) : "",
    d.name,
    formatCalendarDate(d.date, locale.value),
  ].filter(Boolean).join(" · ");
  if (summary) lines.push(t("onboarding.category.draft.discard.event", { summary }));
  else if (d.category || d.hasDesign) lines.push(t("onboarding.category.draft.discard.eventPlain"));

  if (d.design) {
    const design = d.design === BUILDER_DESIGN_ID ? t("editSection.designSwitch.builderName") : designName(d.design) || d.design;
    lines.push(t("onboarding.category.draft.discard.design", { design }));
  }
  const counts = d.counts || {};
  if (counts.details) lines.push(t("onboarding.category.draft.discard.details", { count: counts.details }, counts.details));
  if (counts.agenda) lines.push(t("onboarding.category.draft.discard.agenda", { count: counts.agenda }, counts.agenda));
  if (counts.story) lines.push(t("onboarding.category.draft.discard.story", { count: counts.story }, counts.story));
  if (d.hasSettings) lines.push(t("onboarding.category.draft.discard.settings"));
  if (!lines.length) lines.push(t("onboarding.category.draft.discard.generic"));
  return lines;
});
</script>

<style scoped>
.dds__lead {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink, #101828);
}

.dds__list {
  margin: 0 0 14px;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2, #344054);
  overflow-wrap: anywhere;
}

.dds__warn {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #b42318;
}
</style>
