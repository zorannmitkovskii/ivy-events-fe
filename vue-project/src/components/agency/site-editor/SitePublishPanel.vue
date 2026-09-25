<template>
  <div class="se-publish">
    <div class="se-status" :class="{ live: published }">
      <strong>{{ published ? t('agencySite.editor.live') : t('agencySite.editor.draft') }}</strong>
      <span v-if="published && publicPath">
        <RouterLink :to="publicPath" target="_blank" rel="noopener">{{ publicPath }}</RouterLink>
        <template v-if="host"> · {{ host }}</template>
      </span>
      <span v-else>{{ t('agencySite.editor.draftHint') }}</span>
      <button type="button" class="btn btn-sm" :class="published ? 'btn-ghost' : 'btn-primary'" :disabled="busy"
              @click="$emit('publish', !published)">
        {{ published ? t('agencySite.editor.unpublish') : t('agencySite.editor.publish') }}
      </button>
    </div>

    <form class="se-fields" @submit.prevent="$emit('save')">
      <label class="se-field">
        <span>{{ t('agencySite.editor.fields.siteName') }} *</span>
        <input v-model="settings.name" maxlength="120" required />
      </label>
      <label class="se-field">
        <span>{{ t('agencySite.editor.fields.slug') }} *</span>
        <input v-model="settings.slug" maxlength="63" pattern="[a-z0-9]([a-z0-9\-]*[a-z0-9])?" required
               :placeholder="t('agencySite.editor.slugPlaceholder')" />
        <small>{{ t('agencySite.editor.slugHint') }}</small>
      </label>
      <label class="se-field">
        <span>{{ t('agencySite.editor.fields.email') }}</span>
        <input v-model="settings.email" type="email" maxlength="200" />
      </label>
      <label class="se-field">
        <span>{{ t('agencySite.editor.fields.phone') }}</span>
        <input v-model="settings.phone" maxlength="40" />
      </label>
      <label class="se-field">
        <span>{{ t('agencySite.editor.fields.city') }}</span>
        <input v-model="settings.city" maxlength="120" />
      </label>
      <label class="se-field">
        <span>{{ t('agencySite.editor.fields.seoTitle') }} ({{ (settings.seoTitle || '').length }}/70)</span>
        <input v-model="settings.seoTitle" maxlength="70" />
      </label>
      <label class="se-field wide">
        <span>{{ t('agencySite.editor.fields.seoDescription') }} ({{ (settings.seoDescription || '').length }}/160)</span>
        <textarea v-model="settings.seoDescription" rows="2" maxlength="160"></textarea>
      </label>
      <div class="se-actions wide">
        <button type="submit" class="btn btn-primary btn-sm" :disabled="busy">{{ t('agencySite.editor.saveSettings') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
/**
 * Name, address and SEO — and the switch that puts the site online.
 *
 * <p>The address is also the agency's subdomain. It is claimed when saved, so
 * a taken one is refused here rather than on the day of publishing.
 */
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

defineProps({
  published: { type: Boolean, default: false },
  publicPath: { type: String, default: '' },
  host: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})
defineEmits(['save', 'publish'])

const settings = defineModel('settings', { type: Object, required: true })

const { t } = useI18n()
</script>

<style scoped>
.se-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  font-size: 13px;
}

.se-status.live {
  border-color: var(--ivy);
}

.se-status span {
  flex: 1;
  color: var(--ink-3);
}

.se-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.wide {
  grid-column: 1 / -1;
}

.se-field span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 600;
}

.se-field small {
  color: var(--ink-3);
  font-size: 12px;
}

.se-field input,
.se-field textarea {
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  font: inherit;
  font-size: 14px;
}

.se-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .se-fields {
    grid-template-columns: 1fr;
  }
}
</style>
