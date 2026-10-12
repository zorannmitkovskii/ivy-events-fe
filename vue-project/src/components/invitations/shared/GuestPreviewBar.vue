<template>
  <!--
    INV-602: the bar of the editor's "preview as a guest" (INV-104) — the way
    back to editing, a phone or computer view, the public or private link, and
    notes about what guests will not see or what is still an example, each
    leading to the exact place in the editor. The invitation itself is drawn
    below by the same renderer guests get.
  -->
  <section
    class="gp-bar"
    :aria-label="t('editSection.guestPreview.label')"
    data-testid="draft-preview-bar"
  >
    <div class="gp-bar__row">
      <p class="gp-bar__text">{{ t('editSection.previewBar.text') }}</p>
      <button
        type="button"
        class="gp-bar__back"
        data-testid="preview-back-to-editor"
        @click="emit('back')"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        {{ t('editSection.previewBar.back') }}
      </button>
    </div>

    <div class="gp-bar__row gp-bar__row--controls">
      <div class="gp-bar__group" role="group" :aria-label="t('editSection.guestPreview.device')" data-testid="preview-device">
        <button
          v-for="d in DEVICES"
          :key="d"
          type="button"
          class="gp-bar__choice"
          :class="{ 'gp-bar__choice--on': device === d }"
          :aria-pressed="device === d ? 'true' : 'false'"
          :data-device="d"
          @click="emit('set-device', d)"
        >
          <span v-if="device === d" class="gp-bar__check" aria-hidden="true">✓</span>
          {{ t('editSection.guestPreview.' + d) }}
        </button>
      </div>

      <div class="gp-bar__group" role="group" :aria-label="t('editSection.guestPreview.link')" data-testid="preview-link">
        <button
          v-for="l in LINKS"
          :key="l"
          type="button"
          class="gp-bar__choice"
          :class="{ 'gp-bar__choice--on': privateLink === (l === 'private') }"
          :aria-pressed="privateLink === (l === 'private') ? 'true' : 'false'"
          :aria-describedby="LINK_HINT_ID"
          :data-link="l"
          @click="emit('set-private', l === 'private')"
        >
          <span v-if="privateLink === (l === 'private')" class="gp-bar__check" aria-hidden="true">✓</span>
          {{ t('editSection.guestPreview.' + l + 'Link') }}
        </button>
      </div>
      <p :id="LINK_HINT_ID" class="gp-bar__sr-only">{{ t('editSection.guestPreview.linkHint') }}</p>

      <button
        type="button"
        class="gp-bar__notes-toggle"
        :class="{ 'gp-bar__notes-toggle--some': notes.length }"
        :aria-expanded="notesOpen ? 'true' : 'false'"
        :aria-controls="NOTES_ID"
        data-testid="preview-notes-toggle"
        @click="notesOpen = !notesOpen"
      >
        <span aria-hidden="true">{{ notes.length ? '!' : '✓' }}</span>
        {{ t('editSection.guestPreview.notesToggle', { count: notes.length }) }}
      </button>
      <p
        class="gp-bar__readiness"
        :class="check.ready ? 'gp-bar__readiness--ready' : 'gp-bar__readiness--blocked'"
        data-testid="publish-readiness"
        :data-ready="check.ready ? 'true' : 'false'"
      >
        <span aria-hidden="true">{{ check.ready ? '✓' : '!' }}</span>
        {{ check.ready
          ? t('editSection.prePublish.ready')
          : t('editSection.prePublish.blocked', { count: check.blockers.length }) }}
      </p>
    </div>

    <div v-show="notesOpen" :id="NOTES_ID" class="gp-bar__notes" data-testid="preview-notes">
      <h2 class="gp-bar__notes-title">{{ t('editSection.guestPreview.notesTitle') }}</h2>
      <p v-if="!notes.length" class="gp-bar__none" data-testid="preview-notes-none">
        {{ t('editSection.guestPreview.noNotes') }}
      </p>
      <!-- INV-601: what blocks publishing first, then advice, then what is only explained -->
      <template v-else>
        <div
          v-for="g in groups"
          :key="g.key"
          class="gp-bar__group-notes"
          :data-testid="'publish-group-' + g.key"
        >
          <h3 :id="'gp-group-' + g.key" class="gp-bar__group-title">
            {{ t('editSection.prePublish.groups.' + g.key, { count: g.notes.length }) }}
          </h3>
          <ul class="gp-bar__list" :aria-labelledby="'gp-group-' + g.key">
            <li
              v-for="n in g.notes"
              :key="n.id"
              class="gp-note"
              :class="['gp-note--' + n.kind, { 'gp-note--blocker': g.key === 'blockers' }]"
              data-testid="preview-note"
              :data-kind="n.kind"
              :data-section="n.section"
              :data-severity="g.key"
            >
              <span class="gp-note__kind">{{ t('editSection.guestPreview.kinds.' + n.kind) }}</span>
              <span class="gp-note__text">{{ noteText(n) }}</span>
              <button
                v-if="n.action === NOTE_ACTIONS.EDIT"
                type="button"
                class="gp-note__action"
                :aria-label="t('editSection.guestPreview.openIn', { section: sectionName(n.section) })"
                data-testid="preview-note-edit"
                @click="emit('note-action', n)"
              >{{ t('editSection.guestPreview.edit') }}</button>
              <button
                v-else-if="n.action === NOTE_ACTIONS.PRIVATE_LINK"
                type="button"
                class="gp-note__action"
                data-testid="preview-note-private"
                @click="emit('set-private', true)"
              >{{ t('editSection.guestPreview.showPrivate') }}</button>
            </li>
          </ul>
        </div>
      </template>
    </div>

    <!-- The steps of a new invitation, while previewing it (INV-102) -->
    <div v-if="$slots.steps" class="gp-bar__steps">
      <slot name="steps" />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NOTE_ACTIONS } from '@/utils/guestPreviewNotes';
import { prePublishCheck, publishSeverity } from '@/utils/prePublishCheck';

const props = defineProps({
  // From guestPreviewNotes()
  notes: { type: Array, default: () => [] },
  // 'mobile' | 'desktop'
  device: { type: String, default: 'desktop' },
  privateLink: { type: Boolean, default: false },
  // The event's zone, for the date and deadline messages (INV-104).
  timezone: { type: String, default: '' },
});

const emit = defineEmits(['back', 'set-device', 'set-private', 'note-action']);
const { t } = useI18n();

const DEVICES = ['mobile', 'desktop'];
const LINKS = ['public', 'private'];
const NOTES_ID = 'guest-preview-notes';
const LINK_HINT_ID = 'guest-preview-link-hint';

const notesOpen = ref(false);

// INV-601: the same notes, weighed for publishing — blockers, advice, and
// notes that only explain the preview (never in the way of publishing).
const check = computed(() => prePublishCheck(props.notes));
const groups = computed(() => [
  { key: 'blockers', notes: check.value.blockers },
  { key: 'recommendations', notes: check.value.recommendations },
  { key: 'info', notes: props.notes.filter((n) => publishSeverity(n) === null) },
].filter((g) => g.notes.length));

function sectionName(section) {
  if (section === 'info') return t('editSection.editorGroups.tabs.info');
  if (section === 'design') return t('editSection.designSwitch.title');
  return t('editSection.controls.' + section);
}

function designHiddenText(h) {
  if (h.kind === 'storyPhotos' && h.shown > 0) {
    return t('editSection.designSwitch.hidden.storyPhotosSome', { count: h.count, shown: h.shown });
  }
  return t(`editSection.designSwitch.hidden.${h.kind}`, { count: h.count });
}

function noteText(n) {
  // What the Info panel itself says about the field (INV-104 messages).
  if (n.textKey === 'missingField') return t(n.params.messageKey, { timezone: props.timezone });
  const params = { section: sectionName(n.section), count: n.params.count, timezone: props.timezone };
  if (n.textKey === 'designHidden') params.item = designHiddenText(n.params.item);
  return t('editSection.guestPreview.notes.' + n.textKey, params);
}
</script>

<style scoped>
.gp-bar {
  position: sticky;
  top: 0;
  z-index: 1500;
  display: grid;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid rgba(16, 24, 40, 0.12);
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.08);
  color: var(--ink, #101828);
  font-size: 14px;
}

.gp-bar__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.gp-bar__text {
  flex: 1 1 200px;
  margin: 0;
  font-weight: 600;
  line-height: 1.4;
}

.gp-bar__back,
.gp-bar__choice,
.gp-bar__notes-toggle,
.gp-note__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.2);
  background: #fff;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.gp-bar__back {
  background: var(--brand-main, #334338);
  border-color: var(--brand-main, #334338);
  color: #fff;
}

.gp-bar__group {
  display: inline-flex;
  gap: 4px;
}

/* Chosen: filled, a check mark and aria-pressed — not only a colour. */
.gp-bar__choice--on {
  background: var(--brand-main, #334338);
  border-color: var(--brand-main, #334338);
  color: #fff;
}

.gp-bar__notes-toggle--some {
  border-color: #b54708;
}

.gp-bar__back:focus-visible,
.gp-bar__choice:focus-visible,
.gp-bar__notes-toggle:focus-visible,
.gp-note__action:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

.gp-bar__notes {
  max-height: 40vh;
  overflow-y: auto;
  border-top: 1px solid rgba(16, 24, 40, 0.08);
  padding-top: 8px;
}

.gp-bar__notes-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
}

.gp-bar__none {
  margin: 0;
}

.gp-bar__list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.gp-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  padding: 6px 8px;
  border-radius: 8px;
  border-left: 4px solid #98a2b3;
  background: #f9fafb;
}

.gp-note--missing { border-left-color: #b42318; }
.gp-note--blocker { background: #fef3f2; }

.gp-bar__readiness {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 13px;
  font-weight: 700;
}
.gp-bar__readiness--ready { color: #067647; }
.gp-bar__readiness--blocked { color: #b42318; }

.gp-bar__group-notes + .gp-bar__group-notes {
  margin-top: 10px;
}

.gp-bar__group-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
}
.gp-note--hidden,
.gp-note--empty { border-left-color: #667085; }
.gp-note--example { border-left-color: #b54708; }

.gp-note__kind {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.gp-note__text {
  flex: 1 1 220px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.gp-note__action {
  min-height: 36px;
  font-size: 13px;
}

.gp-bar__steps {
  border-top: 1px solid rgba(16, 24, 40, 0.08);
  padding-top: 6px;
}

.gp-bar__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* A phone: the bar stays compact so the invitation keeps most of the screen. */
@media (max-width: 640px) {
  .gp-bar {
    gap: 6px;
    padding: 8px 12px;
  }
  .gp-bar__row {
    gap: 6px;
  }
  .gp-bar__text {
    flex: 1 1 0;
    min-width: 0;
    font-size: 13px;
  }
  .gp-bar__back,
  .gp-bar__choice,
  .gp-bar__notes-toggle {
    min-height: 36px;
    padding: 4px 10px;
    font-size: 13px;
  }
  .gp-bar__notes {
    max-height: 32vh;
  }
  .gp-bar__steps {
    padding-top: 2px;
  }
}
</style>
