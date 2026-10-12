<template>
  <Teleport to="body">
    <div v-if="open" class="iad-overlay" @mousedown.self="emit('cancel')">
      <div
        ref="dialogRef"
        class="iad"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="bodyId"
        data-testid="invitation-auth-dialog"
        :data-mode="mode"
        :data-conflict="mode === 'choose' ? conflict : null"
        @keydown="onKeydown"
      >
        <h2 :id="titleId" class="iad__title">{{ title }}</h2>
        <div v-if="confirmingDiscard" :id="bodyId" class="iad__body">
          <DraftDiscardScope :draft="localDraft" :logged-in="true" />
        </div>
        <div v-else :id="bodyId" class="iad__body">
          <p>{{ body }}</p>
          <p v-if="photoCount > 0" class="iad__photos">
            {{ t('editSection.authGate.photos', { count: photoCount }, photoCount) }}
          </p>
          <!-- INV-303: what the account already has, so the choice is an informed one -->
          <section
            v-if="mode === 'choose' && conflict === 'events'"
            class="iad__existing"
            :aria-labelledby="existingId"
            data-testid="resume-existing"
          >
            <h3 :id="existingId" class="iad__existing-title">{{ t('editSection.resume.existingTitle') }}</h3>
            <p v-if="existingState === 'loading'" role="status" data-testid="resume-existing-loading">
              {{ t('editSection.resume.existingLoading') }}
            </p>
            <p v-else-if="existingState === 'failed'" role="status" data-testid="resume-existing-failed">
              {{ t('editSection.resume.existingFailed') }}
            </p>
            <ul v-else-if="existingSummaries.length" class="iad__existing-list">
              <li v-for="d in existingSummaries" :key="d.id" data-testid="resume-existing-draft">
                <strong>{{ d.label }}</strong>
                <span v-if="d.updatedOn"> — {{ t('editSection.resume.existingUpdated', { date: d.updatedOn }) }}</span>
              </li>
            </ul>
            <p class="iad__existing-note">{{ t('editSection.resume.existingStay') }}</p>
          </section>
        </div>

        <div class="iad__actions">
          <template v-if="mode === 'gate'">
            <button type="button" class="iad__btn iad__btn--primary" data-testid="auth-gate-signup" @click="emit('signup')">
              {{ t('editSection.authGate.signup') }}
            </button>
            <button type="button" class="iad__btn" data-testid="auth-gate-login" @click="emit('login')">
              {{ t('editSection.authGate.login') }}
            </button>
            <button type="button" class="iad__btn iad__btn--ghost" data-testid="auth-gate-cancel" @click="emit('cancel')">
              {{ t('editSection.authGate.keepEditing') }}
            </button>
          </template>
          <!-- INV-302: discarding is confirmed, with exactly what goes. -->
          <template v-else-if="confirmingDiscard">
            <button type="button" class="iad__btn" data-testid="discard-cancel" @click="cancelDiscard">
              {{ t('onboarding.category.draft.discard.cancel') }}
            </button>
            <button type="button" class="iad__btn iad__btn--danger" data-testid="discard-confirm" :disabled="busy" @click="emit('discard')">
              {{ t('onboarding.category.draft.discard.confirm') }}
            </button>
          </template>
          <template v-else>
            <button type="button" class="iad__btn iad__btn--primary" data-testid="resume-save-new" :disabled="busy" @click="emit('save-new')">
              {{ t('editSection.resume.saveNew') }}
            </button>
            <button type="button" class="iad__btn" data-testid="resume-keep" :disabled="busy" @click="emit('cancel')">
              {{ t('editSection.resume.keep') }}
            </button>
            <button type="button" class="iad__btn iad__btn--danger" data-testid="resume-discard" :disabled="busy" @click="askDiscard">
              {{ t('editSection.resume.discard') }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, useId, watch, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import DraftDiscardScope from "@/components/onboarding/DraftDiscardScope.vue";
import { findResumableDraft } from "@/utils/creationDraft";
import { onboardingStore } from "@/store/onboarding.store";
import { draftStore } from "@/store/invitationDraft.store";
import { loadServerDrafts, formatCalendarDate } from "@/utils/creationDraft";
import { categoryLabelKey } from "@/helper/CategoryMapping.helper.js";

/**
 * The two questions the invitation editor asks around an account (INV-104):
 *
 *  - `gate`: a guest pressed Save. The draft is only in this browser; an
 *    account is needed to keep and publish it. Sign up, sign in, or keep
 *    editing (nothing is lost either way).
 *  - `choose`: back from sign-in with a draft, into an account that already
 *    has an event. Nothing is created or merged on its own: save the draft as
 *    a new event, keep it on this device, or discard it.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "gate" },
  photoCount: { type: Number, default: 0 },
  busy: { type: Boolean, default: false },
  // Why `choose` asks (INV-303): "events" (the account has some), "unchecked"
  // (they could not be listed) or "claimed" (another account on this device
  // already saved this draft).
  conflict: { type: String, default: "events" },
});

const emit = defineEmits(["signup", "login", "cancel", "save-new", "discard"]);
const { t, locale } = useI18n();

const uid = useId();
const titleId = `${uid}-title`;
const existingId = `${uid}-existing`;
const bodyId = `${uid}-body`;
const dialogRef = ref(null);
let returnFocusTo = null;

// "Discard" asks first (INV-302): the same scope the start page shows.
const confirmingDiscard = ref(false);
const localDraft = computed(() => findResumableDraft(onboardingStore, draftStore));

async function askDiscard() {
  confirmingDiscard.value = true;
  await nextTick();
  // The safe answer first.
  dialogRef.value?.querySelector('[data-testid="discard-cancel"]')?.focus();
}

async function cancelDiscard() {
  confirmingDiscard.value = false;
  await nextTick();
  dialogRef.value?.querySelector('[data-testid="resume-discard"]')?.focus();
}

const title = computed(() => {
  if (confirmingDiscard.value) return t("onboarding.category.draft.discard.title");
  if (props.mode === "gate") return t("editSection.authGate.title");
  if (props.conflict === "unchecked") return t("editSection.resume.titleUnchecked");
  if (props.conflict === "claimed") return t("editSection.resume.titleClaimed");
  return t("editSection.resume.title");
});
const body = computed(() => {
  if (props.mode === "gate") return t("editSection.authGate.body");
  if (props.conflict === "unchecked") return t("editSection.resume.bodyUnchecked");
  if (props.conflict === "claimed") return t("editSection.resume.bodyClaimed");
  return t("editSection.resume.body");
});

// The account's drafts (INV-302's list) — name, type and last change only
// when the server has them. Nothing here is changed by this dialog.
const existing = ref([]);
const existingState = ref("idle");

async function loadExisting() {
  existingState.value = "loading";
  try {
    existing.value = await loadServerDrafts();
    existingState.value = "ready";
  } catch {
    existing.value = [];
    existingState.value = "failed";
  }
}

const existingSummaries = computed(() => existing.value.map((d) => {
  const key = d.category ? categoryLabelKey(d.category) : null;
  const category = d.category ? (key ? t(key) : d.category) : "";
  return {
    id: d.id,
    label: d.name || category || t("onboarding.category.start.serverTitle"),
    updatedOn: formatCalendarDate(d.updatedOn, locale.value),
  };
}));

watch(
  () => props.open && props.mode === "choose" && props.conflict === "events",
  (load) => { if (load && existingState.value === "idle") loadExisting(); },
  { immediate: true }
);

function focusables() {
  return dialogRef.value
    ? [...dialogRef.value.querySelectorAll("button:not([disabled])")]
    : [];
}

function onKeydown(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    if (confirmingDiscard.value) cancelDiscard();
    else emit("cancel");
    return;
  }
  if (e.key !== "Tab") return;
  // Keep focus inside the dialog while it is open.
  const items = focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    confirmingDiscard.value = false;
    if (open) {
      returnFocusTo = document.activeElement;
      await nextTick();
      focusables()[0]?.focus();
    } else if (returnFocusTo && typeof returnFocusTo.focus === "function") {
      returnFocusTo.focus();
      returnFocusTo = null;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  returnFocusTo = null;
});
</script>

<style scoped>
.iad-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(16, 24, 40, 0.45);
}

.iad {
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(16, 24, 40, 0.25);
  color: var(--ink, #101828);
  font-family: inherit;
}

.iad__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
}

.iad__body p {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2, #344054);
}

.iad__photos {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fffaeb;
  border: 1px solid #fedf89;
  color: #93370d !important;
}

.iad__existing {
  margin: 4px 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid rgba(16, 24, 40, 0.1);
}

.iad__existing-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
}

.iad__existing-list {
  margin: 0 0 8px;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.iad__body .iad__existing-note {
  margin: 0;
  font-size: 13px;
}

.iad__actions {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.iad__btn {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.15);
  background: #fff;
  color: var(--ink, #101828);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.iad__btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

.iad__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.iad__btn--primary {
  background: var(--brand-main, #334338);
  border-color: var(--brand-main, #334338);
  color: #fff;
}

.iad__btn--ghost {
  border-color: transparent;
  background: transparent;
}

.iad__btn--danger {
  color: #b42318;
}
</style>
