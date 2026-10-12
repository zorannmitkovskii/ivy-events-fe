import { reactive, ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import { getFutureWeddingDate, formatWeddingDateFull, toLocalISO } from '@/utils/date.js';
import { useInvitationEditMode } from '@/composables/useInvitationEditMode';
import { useToast } from '@/composables/useToast';
import { useSectionState } from '@/composables/useSectionState';
import {
  getDraftTheme, setDraftTheme,
  getDraftSectionState, setDraftSectionState,
  setDraftFullPayload,
  getDraftClientRequestId,
  clearDraft,
  saveUnsyncedSnapshot,
  getUnsyncedSnapshot,
  clearUnsyncedSnapshot,
} from '@/store/invitationDraft.store';
import { createAutosave, SAVE_STATUS } from '@/composables/useAutosave';
import { createEditHistory } from '@/composables/useEditHistory';
import { createInvitationPhotos } from '@/composables/useInvitationPhotos';
import { isAuthenticated } from '@/services/auth.service';
import { setDraftPendingFiles, markDraftCreateSent, renewDraftClientRequestId, replaceDraftItems, generateLocalId } from '@/store/invitationDraft.store';
import { currentAccount, isClaimedKeyError, RESUME_CONFLICT } from '@/composables/useDraftSync';
import { onboardingStore, setEventDetails } from '@/store/onboarding.store';
import {
  DEFAULT_TIMEZONE, basicsToInvitationInfo, hasBasics, usesCoupleNames, rsvpReplyByDate,
  normalizeBasics, epochToZonedWallClock, isValidTimeZone,
} from '@/utils/eventBasics';
import { landingAfterAuth } from '@/router/landing';
import { OUR_STORY_FIELD_CONFIG } from '@/config/ourStoryFieldConfig.js';
import { EventDetailTypeSortOrder } from '@/enums/EventDetailType';
import { buildEventFullPayload } from '@/utils/buildEventFullPayload';
import { discardLocalDraft } from '@/utils/creationDraft';
import { startLoading, stopLoading } from '@/store/loading.store';
import { withoutUnsavedExamples } from '@/utils/creationSteps';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const SHADOW_MAP = {
  none: 'none',
  subtle: '0px 4px 20px rgba(0,0,0,0.08)',
  medium: '0px 6px 24px rgba(0,0,0,0.12)',
  strong: '0px 10px 40px rgba(0,0,0,0.18)',
};

const SPACING_MAP = {
  compact:  { section: '48px 16px',  gap: '24px', cardPadding: '20px' },
  balanced: { section: '80px 24px',  gap: '32px', cardPadding: '32px' },
  spacious: { section: '120px 32px', gap: '48px', cardPadding: '40px' },
};

/**
 * INV-402: a save held back because a section of an existing event could not
 * be read — sending it would replace the stored entries with an empty list.
 */
export class SectionsNotLoadedError extends Error {
  constructor(sections) {
    super(`Sections not loaded: ${sections.join(', ')}`);
    this.name = 'SectionsNotLoadedError';
    this.sections = [...sections];
  }
}

export function isSectionsNotLoaded(err) {
  return err?.name === 'SectionsNotLoadedError';
}

/* ------------------------------------------------------------------ */
/*  Composable                                                        */
/* ------------------------------------------------------------------ */

export function useWeddingInvitation(preset) {
  /* ---- Core composables ------------------------------------------ */
  const { t, locale } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { eventId, loading, error: eventReadError, localized, formatDate, formatTime, fetchData } = useInvitationData();
  // INV-403: whether the event itself (/public/invitation-page) was read.
  // 'idle' — no event behind the page (a draft); 'failed' — it could not be
  // read, so the names, date, place and settings on screen are the design's
  // demo, not the event's, and must never be saved over it.
  const eventLoad = ref(eventId ? 'loading' : 'idle');
  let eventLoadPromise = Promise.resolve();

  const {
    isEditMode, activeModal, activeRootSection, editingItem,
    openModal, closeModal, closeAllModals, selectSection, refreshCallback,
    agenda, eventDetails, ourStory,
    handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
    handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
    handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,
    loadEditData, fetchInvitationConfig,
    dirty, changed, previewMode, markDirty, clearDirty, toggleSection, setupUnsavedGuard,
    saveFullEvent, saving,
    onChange, adoptSavedIds, eventId: editEventId, setEditTracker, currentIdOf,
    sectionLoad, failedSections, isSectionLoaded, whenSectionsSettled, retryFailedSections,
  } = useInvitationEditMode();

  const toast = useToast();

  /* ---- Template refs & UI state ---------------------------------- */
  const rootRef = ref(null);
  const entryRef = ref(null);
  const showEntry = ref(true);
  const showAgenda = ref(true);
  const showOurStory = ref(true);
  const entryType = ref(preset.entryType || 'envelop');
  const entryDesign = ref(preset.entryDesign || 'white-gold-seal');

  /* ---- Hero/section family (switchable in edit mode) ------------- */
  const heroFamily = ref(preset.family || 'coastal');
  const detailsFamily = ref(preset.family || 'coastal');
  const scheduleFamily = ref(preset.family || 'coastal');
  const storyFamily = ref(preset.family || 'coastal');

  function onHeroFamilyChange(family) {
    heroFamily.value = family;
    markDirty();
  }
  function onDetailsFamilyChange(family) {
    detailsFamily.value = family;
    markDirty();
  }
  function onScheduleFamilyChange(family) {
    scheduleFamily.value = family;
    markDirty();
  }
  function onStoryFamilyChange(family) {
    storyFamily.value = family;
    markDirty();
  }

  /* ---- Reactive style state from preset -------------------------- */
  const rootBg = ref(preset.rootBg || '#fff');
  const palette = reactive({ ...preset.palette });
  const fonts = reactive({ ...preset.fonts });
  const buttonStyle = reactive({ ...preset.buttonStyle });
  const cardStyle = reactive({ ...preset.cardStyle });
  const spacingPreset = ref('balanced');
  const rsvpConfig = reactive({
    deadline: '', maxGuests: 5, showDietary: true, borderRadius: '8px',
  });

  /* ---- Color fields ---------------------------------------------- */
  const COLOR_FIELDS = [
    { key: 'accent',    label: t('editSection.accentColor') },
    { key: 'secondary', label: t('editSection.secondaryColor') },
    { key: 'text',      label: t('editSection.textColor') },
  ];

  const colorFields = computed(() =>
    COLOR_FIELDS.map(f => ({ ...f, value: palette[f.key] }))
  );

  /* ---- Shadows computed ------------------------------------------ */
  const shadows = computed(() => ({
    card:      SHADOW_MAP[cardStyle.cardShadow],
    cardHover: cardStyle.cardShadow === 'none' ? 'none' : SHADOW_MAP.medium,
  }));

  /* ---- Derived card bg (always contrasts with section bg) -------- */
  function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s * 100, l * 100];
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }

  /** Make card bg visibly different from section bg */
  const contrastCardBg = computed(() => {
    const bg = cardStyle.sectionBg || '#f9fafb';
    try {
      const [h, s, l] = hexToHsl(bg);
      // Dark theme: cards lighter; Light theme: cards slightly different
      if (l < 25) return hslToHex(h, s, Math.min(l + 6, 100));
      return hslToHex(h, Math.max(s - 5, 0), Math.max(l - 4, 0));
    } catch { return cardStyle.cardBg || '#ffffff'; }
  });

  /** Contrast text color: light text on dark bg, dark text on light bg */
  function contrastText(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#1f2937';
    try {
      const [, , l] = hexToHsl(hex);
      return l < 45 ? '#F7F2E8' : '#1f2937';
    } catch { return '#1f2937'; }
  }

  /** Muted/secondary text: slightly transparent version of the contrast text */
  function contrastMuted(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#6b7280';
    try {
      const [, , l] = hexToHsl(hex);
      return l < 45 ? '#c8c3b8' : '#6b7280';
    } catch { return '#6b7280'; }
  }

  /** Badge/pill background: accent-tinted for light themes, lighter for dark */
  function badgeBg(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return accentTint();
    try {
      const [h, s, l] = hexToHsl(hex);
      if (l < 45) return hslToHex(h, Math.max(s - 5, 0), Math.min(l + 12, 100));
      return accentTint();
    } catch { return accentTint(); }
  }

  /** Subtle card/item bg: same hue as section, just slightly lighter */
  function lighterBg(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#ffffff';
    try {
      const [h, s, l] = hexToHsl(hex);
      if (l < 45) return hslToHex(h, Math.max(s - 5, 0), Math.min(l + 8, 100));
      return hslToHex(h, s, Math.min(l + 3, 100));
    } catch { return '#ffffff'; }
  }

  /** Border color: subtle, semi-transparent on both dark and light themes */
  function borderColor(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#e5e5e5';
    try {
      const [, , l] = hexToHsl(hex);
      return l < 45 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    } catch { return '#e5e5e5'; }
  }

  function accentTint() {
    try {
      const [h, s] = hexToHsl(palette.accent || '#c8a24d');
      return hslToHex(h, Math.min(s * 0.4, 30), 92);
    } catch { return '#f6f1e3'; }
  }

  /* ---- Root style computed --------------------------------------- */
  /** Derive a muted version of the master text color (lower opacity feel) */
  function mutedText(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#6b7280';
    try {
      const [h, s, l] = hexToHsl(hex);
      // Push lightness toward middle: dark text → lighten, light text → darken slightly
      if (l < 50) return hslToHex(h, Math.max(s - 15, 0), Math.min(l + 25, 70));
      return hslToHex(h, Math.max(s - 10, 0), Math.max(l - 15, 40));
    } catch { return '#6b7280'; }
  }

  const rootStyle = computed(() => {
    const textMuted = mutedText(palette.text);
    return {
      '--root-bg':            rootBg.value,
      '--font-heading':       fonts.heading,
      '--font-body':          fonts.body,
      '--theme-accent':       palette.accent,
      '--theme-secondary':    palette.secondary,
      '--theme-text':         palette.text,
      '--theme-text-muted':   textMuted,
      '--section-text':       palette.text,
      '--section-text-muted': textMuted,
      '--card-text':          palette.text,
      '--card-text-muted':    textMuted,
      '--badge-bg':           badgeBg(rootBg.value),
      '--badge-bg-alt':       badgeBg(cardStyle.sectionBg || rootBg.value),
      '--badge-text':         palette.text,
      '--badge-text-alt':     palette.text,
      '--item-bg':            lighterBg(rootBg.value),
      '--item-bg-alt':        lighterBg(cardStyle.sectionBg || rootBg.value),
      '--border-color':       borderColor(rootBg.value),
      '--btn-bg':             buttonStyle.bg,
      '--btn-text':           buttonStyle.text,
      '--btn-radius':         buttonStyle.radius,
      '--section-bg':         cardStyle.sectionBg,
      '--card-bg':            contrastCardBg.value,
      '--card-shadow':        SHADOW_MAP[cardStyle.cardShadow],
      '--card-radius':        cardStyle.cardRadius,
      '--card-border-width':  cardStyle.cardBorder,
      '--section-padding':    SPACING_MAP[spacingPreset.value].section,
      '--content-gap':        SPACING_MAP[spacingPreset.value].gap,
      '--card-padding':       SPACING_MAP[spacingPreset.value].cardPadding,
    };
  });

  /* ---- Sidebar sections ------------------------------------------ */
  // INV-103: `advanced` — shown only in the advanced settings (useEditorMode);
  // `layout` — has a Layout sub-tab where the design offers layouts;
  // `panel` — a plain panel (not a modal): on a phone it opens inside the sheet.
  // INV-501: `group` — the editor task group (useEditorMode.EDITOR_GROUPS): content and
  // rsvp in the Content tab, animation and look in the advanced Style tab. `tab` stays
  // data: it orders the saved `sectionOrder` and is not where the control shows.
  // `switch: false` — no show/hide switch: the invitation does not draw that visibility
  // (story photos follow the story, collage photos the gallery opening).
  const SIDEBAR_SECTIONS = [
    // Data tab 'sections' (saved order)
    { key: 'entry',        get label() { return t('editSection.controls.entry'); }, tab: 'sections', group: 'animation', advanced: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>' },
    { key: 'hero',         get label() { return t('editSection.controls.hero'); }, tab: 'sections', group: 'content', mandatory: true, layout: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { key: 'details',      get label() { return t('editSection.controls.details'); }, tab: 'sections', group: 'content', layout: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { key: 'agendaList',   get label() { return t('editSection.controls.agendaList'); }, tab: 'sections', group: 'content', layout: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
    { key: 'ourStoryList', get label() { return t('editSection.controls.ourStoryList'); }, tab: 'sections', group: 'content', layout: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { key: 'ourStoryImages', get label() { return t('editSection.controls.ourStoryImages'); }, tab: 'sections', group: 'content', panel: true, switch: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { key: 'collage',      get label() { return t('editSection.controls.collage'); }, tab: 'sections', group: 'animation', advanced: true, panel: true, switch: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { key: 'rsvp',         get label() { return t('editSection.controls.rsvp'); }, tab: 'sections', group: 'rsvp', mandatory: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
    // Data tab 'style'
    { key: 'colors',     get label() { return t('editSection.controls.colors'); }, tab: 'style', group: 'look', advanced: true, panel: true, switch: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="14.5" cy="19.5" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="4.5" cy="9.5" r="2.5"/></svg>' },
    { key: 'fonts',      get label() { return t('editSection.controls.fonts'); }, tab: 'style', group: 'look', advanced: true, switch: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>' },
  ];

  /* ---- Section layout definitions -------------------------------- */
  const SECTION_LAYOUTS = {
    hero: [
      { key: 'centered', label: t('editSection.layoutCentered'), diagram: '<svg viewBox="0 0 64 48"><rect x="16" y="4" width="32" height="6" rx="1" fill="#9ca3af"/><rect x="8" y="14" width="48" height="14" rx="1" fill="#d1d5db"/><rect x="20" y="34" width="24" height="6" rx="1" fill="#9ca3af"/></svg>' },
      { key: 'left', label: t('editSection.layoutLeftAligned'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="28" height="6" rx="1" fill="#9ca3af"/><rect x="4" y="14" width="36" height="14" rx="1" fill="#d1d5db"/><rect x="4" y="34" width="20" height="6" rx="1" fill="#9ca3af"/></svg>' },
      { key: 'split', label: t('editSection.layoutSplit'), diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="44" rx="2" fill="#d1d5db"/><rect x="34" y="8" width="26" height="6" rx="1" fill="#9ca3af"/><rect x="34" y="18" width="26" height="10" rx="1" fill="#e5e7eb"/><rect x="34" y="34" width="18" height="6" rx="1" fill="#9ca3af"/></svg>' },
    ],
    details: [
      { key: 'cards', label: t('editSection.layoutCards'), diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="23" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="44" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="12" y="28" width="40" height="6" rx="1" fill="#e5e7eb"/></svg>' },
      { key: 'list', label: t('editSection.layoutList'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="56" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="18" width="56" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="32" width="56" height="10" rx="2" fill="#d1d5db"/></svg>' },
    ],
    agendaList: [
      { key: 'timeline', label: t('editSection.layoutTimeline'), diagram: '<svg viewBox="0 0 64 48"><line x1="32" y1="4" x2="32" y2="44" stroke="#9ca3af" stroke-width="2"/><circle cx="32" cy="10" r="3" fill="#d1d5db"/><circle cx="32" cy="24" r="3" fill="#d1d5db"/><circle cx="32" cy="38" r="3" fill="#d1d5db"/><rect x="38" y="7" width="22" height="6" rx="1" fill="#e5e7eb"/><rect x="4" y="21" width="22" height="6" rx="1" fill="#e5e7eb"/><rect x="38" y="35" width="22" height="6" rx="1" fill="#e5e7eb"/></svg>' },
      { key: 'cards', label: t('editSection.layoutCards'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="2" width="56" height="12" rx="2" fill="#d1d5db"/><rect x="4" y="18" width="56" height="12" rx="2" fill="#d1d5db"/><rect x="4" y="34" width="56" height="12" rx="2" fill="#d1d5db"/></svg>' },
    ],
    ourStoryList: [
      { key: 'gallery', label: t('editSection.layoutGrid'), diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="2" y="26" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="26" width="28" height="20" rx="2" fill="#d1d5db"/></svg>' },
      { key: 'timeline', label: t('editSection.layoutTimeline'), diagram: '<svg viewBox="0 0 64 48"><line x1="32" y1="4" x2="32" y2="44" stroke="#9ca3af" stroke-width="2"/><rect x="4" y="6" width="24" height="14" rx="2" fill="#d1d5db"/><rect x="36" y="28" width="24" height="14" rx="2" fill="#d1d5db"/></svg>' },
    ],
    rsvp: [
      { key: 'card', label: t('editSection.layoutCards'), diagram: '<svg viewBox="0 0 64 48"><rect x="8" y="4" width="48" height="40" rx="4" fill="#d1d5db"/><rect x="14" y="12" width="36" height="6" rx="1" fill="#9ca3af"/><rect x="14" y="22" width="36" height="6" rx="1" fill="#9ca3af"/><rect x="20" y="34" width="24" height="6" rx="2" fill="#6b7280"/></svg>' },
      { key: 'compact', label: t('editSection.layoutCompact'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="10" width="56" height="28" rx="2" fill="#d1d5db"/><rect x="8" y="16" width="24" height="5" rx="1" fill="#9ca3af"/><rect x="8" y="24" width="24" height="5" rx="1" fill="#9ca3af"/><rect x="36" y="16" width="20" height="14" rx="2" fill="#6b7280"/></svg>' },
    ],
  };

  /* ---- Section state (order, visibility, layouts, overrides) ----- */
  const {
    sectionOrder, sectionVisibility, sectionLayouts, sectionOverrides,
    orderedSections, isSectionVisible, toggleVisibility,
    reorder, setLayout, setOverride, clearOverride, getSectionStatus,
    getState: getSectionState, loadState: loadSectionState,
  } = useSectionState(SIDEBAR_SECTIONS);

  /* ---- Section advanced state ------------------------------------ */
  const sectionAdvancedState = reactive({});

  /* ---- Section statuses computed --------------------------------- */
  const sectionStatuses = computed(() => {
    const result = {};
    SIDEBAR_SECTIONS.filter(s => s.tab === 'sections').forEach(s => {
      result[s.key] = getSectionStatus(s.key, config);
    });
    return result;
  });

  /* ---- Optional sections: empty, hidden, skipped (INV-402) -------- */
  // Whether a list section has anything for the guests. An empty one is left
  // out of the invitation guests open rather than drawn as an empty block.
  const sectionHasContent = computed(() => ({
    agendaList:   (config.scheduleEvents?.length || 0) > 0,
    ourStoryList: (config.stories?.length || 0) > 0 || serverStoryImageCount.value > 0,
  }));

  /**
   * Shows or hides an optional section ("Skip this section" / "Show it
   * again"). Only the visibility changes: the entries stay in the editor and
   * in every save, so showing it again brings them back.
   */
  function setSectionShown(key, shown) {
    if (isSectionVisible(key) !== shown) toggleVisibility(key);
    markDirty();
  }

  /* ---- Entry active computed ------------------------------------- */
  const entryActive = computed(() => showEntry.value && isSectionVisible('entry'));

  /* ---- isPrivate computed ---------------------------------------- */
  const isPrivate = computed(() =>
    route.query.isPrivate === 'true' ||
    route.name === 'weddingInvitationPrivate' ||
    route.path.endsWith('/private')
  );

  /* ---- Config reactive ------------------------------------------- */
  const _futureDate = getFutureWeddingDate();
  const dc = preset.defaultConfig || {};

  const config = reactive({
    brideName:       dc.brideName       || '',
    groomName:       dc.groomName       || '',
    weddingDate:     formatWeddingDateFull(_futureDate),
    weddingDateTime: toLocalISO(_futureDate, '16:00:00'),
    weddingTime:     '4:00 PM',
    // The event's own zone (INV-104): date, time and the RSVP deadline are
    // the wall clock there.
    eventTimezone:   DEFAULT_TIMEZONE,
    venue:           dc.venue           || '',
    location:        dc.location        || '',
    heroPhotoUrl:    dc.heroPhotoUrl    || '',
    heroLabel:       t('invitation.youreInvited'),
    ctaLabel:        t('invitation.rsvpNow'),
    galleryPhotos: [
      { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop', alt: 'Photo 1' },
      { url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=400&fit=crop', alt: 'Photo 2' },
      { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop', alt: 'Photo 3' },
      { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop', alt: 'Photo 4' },
      { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=400&fit=crop', alt: 'Photo 5' },
      { url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop', alt: 'Photo 6' },
    ],

    ceremonyDate:    '',
    ceremonyTime:    dc.ceremonyTime    || '16:00',
    ceremonyVenue:   dc.ceremonyVenue   || t('invitation.ceremony'),
    ceremonyMapUrl:  '',
    receptionDate:   '',
    receptionTime:   dc.receptionTime   || '19:00',
    receptionVenue:  dc.receptionVenue  || t('invitation.reception'),
    receptionMapUrl: '',
    heroMapUrl:      '',
    locationMapUrl:  '',

    scheduleTitle:  t('invitation.schedule'),
    scheduleEvents: dc.scheduleEvents || [
      { timeValue: '14:00', timePeriod: '', title: t('agenda.types.START_GROOM') || 'Тргнување младоженец', description: '', time: '14:00', subtitle: '' },
      { timeValue: '14:30', timePeriod: '', title: t('agenda.types.START_BRIDE') || 'Тргнување невеста', description: '', time: '14:30', subtitle: '' },
      { timeValue: '15:00', timePeriod: '', title: t('agenda.types.CHURCH') || 'Црква', description: '', time: '15:00', subtitle: '' },
      { timeValue: '16:00', timePeriod: '', title: t('agenda.types.CEREMONY') || 'Церемонија', description: dc.venue || 'Градска сала', time: '16:00', subtitle: dc.venue || 'Градска сала' },
      { timeValue: '18:00', timePeriod: '', title: t('agenda.types.RECEPTION') || 'Прием', description: dc.venue || 'Голема сала', time: '18:00', subtitle: dc.venue || 'Голема сала' },
      { timeValue: '20:00', timePeriod: '', title: t('agenda.types.FIRST_DANCE') || 'Прв танц', description: '', time: '20:00', subtitle: '' },
    ],

    storyTitle: t('invitation.ourStory'),
    stories: dc.stories || [
      { imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop', date: '2018', title: t('invitation.howWeMet'), text: t('invitation.howWeMetDefault') || 'Случајна средба во кафуле што го промени се.', description: t('invitation.howWeMetDefault') || 'Случајна средба во кафуле што го промени се.' },
      { imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop', date: '2019', title: t('invitation.firstDate'), text: t('invitation.firstDateDefault') || 'Пикник на заход на сонцето покрај езерото, разговор што траеше со часови.', description: t('invitation.firstDateDefault') || 'Пикник на заход на сонцето покрај езерото, разговор што траеше со часови.' },
      { imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop', date: '2024', title: t('invitation.theProposal'), text: t('invitation.theProposalDefault') || 'Под ѕвездите, прашање беше поставено и ветување дадено.', description: t('invitation.theProposalDefault') || 'Под ѕвездите, прашање беше поставено и ветување дадено.' },
    ],

    storyPhotos: [
      { url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop', alt: 'Photo 1' },
      { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop', alt: 'Photo 2' },
      { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop', alt: 'Photo 3' },
      { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=500&fit=crop', alt: 'Photo 4' },
    ],
    storyImageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=2070&q=80',
    storyParagraphs: dc.storyParagraphs || [
      t('invitation.howWeMetDefault') || 'A chance encounter at a coffee shop that changed everything.',
      t('invitation.theProposalDefault') || 'Under the stars, a question was asked and a promise was made.',
    ],
    signatureUrl: '',
    rsvpMessage: '',
  });

  /* ---- RSVP line the guests read (INV-401) ------------------------ */
  // "Please respond by …" above the form follows what is entered now: the
  // RSVP deadline, else 14 days before the event's date — in the editor's
  // preview and on the public invitation alike, so they cannot differ.
  const serverRsvpDeadline = ref('');
  function refreshRsvpMessage() {
    const by = rsvpReplyByDate(rsvpConfig.deadline || serverRsvpDeadline.value, config.weddingDateTime);
    // Noon, so the shown day does not move with the viewer's offset.
    config.rsvpMessage = by ? t('invitation.rsvpSubtitle', { date: formatDate(`${by}T12:00:00`) }) : '';
  }
  watch(
    [() => rsvpConfig.deadline, () => config.weddingDateTime, serverRsvpDeadline, locale],
    refreshRsvpMessage,
    { immediate: true },
  );

  /* ---- Hero event data computed ---------------------------------- */
  const heroEventData = computed(() => ({
    heroImageUrl: config.heroPhotoUrl || '',
  }));

  /* ---- Photos (INV-403) ------------------------------------------- */
  // Every photo slot — hero, story, collage — and what each picked photo is
  // in: checked, waiting, uploading with the save, saved or failed. A change
  // to any slot is a change to save (before, story and collage slot picks did
  // not count as one, so an existing event's autosave left them out).
  // Autosave sends the photos of a kind only when they changed since the
  // last successful save; the server keeps the stored images otherwise.
  const photos = createInvitationPhotos({
    onChange: () => markDirty(),
    serverBacked: () => isAuthenticated() && !!editEventId.value,
  });
  const heroFallback = dc.heroPhotoUrl || '';
  const usablePicks = (name) => {
    const g = photos.groups[name];
    return Object.keys(g.picks).map(Number).sort((a, b) => a - b).map((i) => g.picks[i])
      .filter((p) => p.file && p.status !== 'invalid' && p.status !== 'checking');
  };
  // The files waiting to be saved (read-only views of the slots).
  const heroFile = computed(() => usablePicks('hero')[0]?.file || null);
  const ourStoryFiles = computed(() => usablePicks('story').map((p) => p.file));
  const collageFiles = computed(() => usablePicks('collage').map((p) => p.file));

  function showHeroPreview() {
    config.heroPhotoUrl = photos.previewUrl('hero', 0, '') || heroFallback;
  }

  /** A photo chosen for a slot. Returns why it was refused, or null. */
  function pickPhoto(name, index, file) {
    const problem = photos.pick(name, index, file);
    if (name === 'hero') showHeroPreview();
    return problem;
  }

  /** Takes a photo out of a slot (a pick is dropped; a saved one goes with the next save). */
  function removePhoto(name, index) {
    photos.remove(name, index);
    if (name === 'hero') showHeroPreview();
  }

  function restorePhoto(name, index) {
    photos.restore(name, index);
    if (name === 'hero') showHeroPreview();
  }

  /** The browser could not draw a picked photo: it is refused, never shown as saved. */
  function brokenPhoto(name, index) {
    photos.markBroken(name, index);
    if (name === 'hero') showHeroPreview();
  }

  /* ---- Backend data ref ------------------------------------------ */
  const backendData = ref(null);
  // Story photos the event really has (not the design's demo photos).
  const serverStoryImageCount = ref(0);

  /* ================================================================ */
  /*  Font utilities                                                  */
  /* ================================================================ */

  function extractFontName(cssFontFamily) {
    return cssFontFamily.replace(/^'|'.*$/g, '');
  }

  function loadGoogleFont(name) {
    const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  }

  /* ================================================================ */
  /*  Time-parsing helper                                             */
  /* ================================================================ */

  function parseTimeToMinutes(str) {
    if (!str) return 0;
    const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const p = m[3]?.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  }

  /* ================================================================ */
  /*  Event handlers                                                  */
  /* ================================================================ */

  function onAdvancedUpdate(key, data) {
    if (data.visible !== undefined) {
      if (data.visible) {
        if (sectionVisibility.value[key] === false) toggleVisibility(key);
      } else {
        if (sectionVisibility.value[key] !== false) toggleVisibility(key);
      }
    }
    sectionAdvancedState[key] = { anchorId: data.anchorId, animation: data.animation };
    if (data.overrides) {
      setOverride(key, data.overrides);
    } else {
      clearOverride(key);
    }
    markDirty();
  }

  function onEntryChange({ type, design }) {
    const changed = entryType.value !== type || entryDesign.value !== design;
    entryType.value = type;
    entryDesign.value = design;
    if (changed) showEntry.value = true;
    markDirty();
  }

  function onHeroChange(data) {
    if (data.heroFile) {
      // A refused file is not drawn (INV-403); a good one shows at once.
      const problem = photos.pick('hero', 0, data.heroFile, { url: data.heroImageUrl });
      if (!problem && data.heroImageUrl) config.heroPhotoUrl = data.heroImageUrl;
      else showHeroPreview();
      return;
    }
    if (data.heroImageUrl) config.heroPhotoUrl = data.heroImageUrl;
    markDirty();
  }

  // True once the names/date/place are the user's own (typed here, or restored
  // from their draft or onboarding basics) rather than a design's demo text.
  const basicsKnown = ref(false);

  function onInfoChange(data) {
    basicsKnown.value = true;
    if (data.brideName !== undefined) config.brideName = data.brideName;
    if (data.groomName !== undefined) config.groomName = data.groomName;
    // Date and time are the wall clock where the event is (INV-104); kept
    // together so changing one does not drop the other.
    if (data.date || data.time) {
      const date = data.date || (config.weddingDateTime || '').slice(0, 10);
      const time = data.time !== undefined ? data.time : (config.weddingDateTime || '').slice(11, 16);
      if (date) setWallClock(date, time);
    }
    if (data.timezone && isValidTimeZone(data.timezone)) config.eventTimezone = data.timezone;
    if (data.location) {
      const loc = data.location;
      if (loc.name) config.venue = loc.name;
      if (loc.address) config.location = loc.address;
      config.locationLat = loc.lat || null;
      config.locationLng = loc.lng || null;
      const mapUrl = buildMapUrl({ latitude: loc.lat, longitude: loc.lng });
      if (mapUrl) {
        config.locationMapUrl = mapUrl;
        config.heroMapUrl = mapUrl;
      }
    }
    markDirty();
  }

  /** Sets the start as "YYYY-MM-DDTHH:mm:00" in the event's zone, and the display strings. */
  function setWallClock(date, time) {
    const iso = `${date}T${time || '00:00'}:00`;
    config.weddingDateTime = iso;
    config.weddingDate = formatDate(iso);
    config.weddingTime = time ? formatTime(iso) : '';
  }

  function onColorsChange(colors) {
    Object.assign(palette, colors);
    markDirty();
  }

  function onFontsChange({ heading, body }) {
    const headingCss = `'${heading}', ${/Script|Vibes|Brush|Parisienne/.test(heading) ? 'cursive' : 'serif'}`;
    fonts.heading = headingCss;
    fonts.body = `'${body}', sans-serif`;
    loadGoogleFont(heading);
    loadGoogleFont(body);
    markDirty();
  }

  function onRsvpChange(cfg) {
    Object.assign(rsvpConfig, cfg);
    markDirty();
  }

  function onButtonsChange({ bg, text, radius }) {
    Object.assign(buttonStyle, { bg, text, radius });
    markDirty();
  }

  function onBackgroundChange(style) {
    Object.assign(cardStyle, style);
    markDirty();
  }

  function onSpacingChange(preset) {
    spacingPreset.value = preset;
    markDirty();
  }

  /* ---- CRUD handlers --------------------------------------------- */

  function onDetailsAdd() {
    openModal('eventDetail');
  }
  function onDetailsEdit(item) {
    openModal('eventDetail', item);
  }
  async function onDetailsDelete(id, original) {
    await handleEventDetailDelete(id, original);
  }

  function onAgendaAdd() {
    openModal('agendaItem');
  }
  function onAgendaEdit(item) {
    openModal('agendaItem', item);
  }
  // Re-read only an event's list: a draft has no server list, and the
  // onboarding store may point at another event (INV-402).
  async function onAgendaDelete(id, original) {
    await handleAgendaDelete(id, original);
    if (id && isAuthenticated() && editEventId.value) agenda.loadAgenda();
  }

  function onOurStoryAdd() {
    openModal('ourStoryItem');
  }
  function onOurStoryEdit(item) {
    openModal('ourStoryItem', item);
  }
  async function onOurStoryDelete(id, original) {
    await handleOurStoryDelete(id, original);
    if (id && isAuthenticated() && editEventId.value) ourStory.loadStories();
  }

  /* ================================================================ */
  /*  Backend data application                                        */
  /* ================================================================ */

  function applyBackendData(data) {
    const ev = data.event;
    if (!ev) return;

    showAgenda.value   = ev.showAgenda ?? true;
    showOurStory.value = ev.showOurStory ?? true;

    if (ev.coupleNames?.bride) config.brideName = ev.coupleNames.bride;
    if (ev.coupleNames?.groom) config.groomName = ev.coupleNames.groom;
    if (ev.heroImageUrl) config.heroPhotoUrl = ev.heroImageUrl;
    photos.setServer('hero', ev.heroImageUrl ? [ev.heroImageUrl] : []);

    if (ev.date) {
      config.weddingDateTime = ev.date;
      config.weddingDate = formatDate(ev.date);
      config.weddingTime = formatTime(ev.date);
    }
    // INV-104: the start is an instant; shown as the wall clock in the
    // event's own zone, whatever zone the viewer's browser is in.
    if (isValidTimeZone(ev.timezone)) config.eventTimezone = ev.timezone;
    if (ev.startDate) {
      const wall = epochToZonedWallClock(ev.startDate, config.eventTimezone);
      if (wall) setWallClock(wall.slice(0, 10), wall.slice(11, 16));
    }

    const subtitle = localized(ev.messageI18n, ev.message);
    if (subtitle) config.heroLabel = subtitle;

    if (data.location) {
      const loc = data.location;
      if (loc.venueName) config.venue = loc.venueName;
      const addressStr = [loc.city, loc.country].filter(Boolean).join(', ') || loc.address || '';
      if (addressStr) config.location = addressStr;
      const mapUrl = buildMapUrl(loc);
      if (mapUrl) {
        config.locationMapUrl = mapUrl;
        config.heroMapUrl = mapUrl;
      }
    }

    // Event Details -> ceremony / reception / location cards
    if (Array.isArray(data.weddingDetails) && data.weddingDetails.length) {
      const sorted = [...data.weddingDetails].sort(
        (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
      );

      const churchItem = sorted.find(d => d.type === 'CHURCH' || d.type === 'REGISTRATION');
      if (churchItem) {
        config.ceremonyDate    = churchItem.eventDate || '';
        config.ceremonyTime    = churchItem.time || '';
        config.ceremonyVenue   = t('detailTypes.' + churchItem.type);
        config.ceremonyMapUrl  = buildMapUrl(churchItem.location);
      }

      const receptionItem = sorted.find(d => d.type === 'RECEPTION');
      if (receptionItem) {
        config.receptionDate   = receptionItem.eventDate || '';
        config.receptionTime   = receptionItem.time || '';
        config.receptionVenue  = t('detailTypes.' + receptionItem.type);
        config.receptionMapUrl = buildMapUrl(receptionItem.location);
      }
    }

    // INV-402: on the invitation guests open, an event without a programme or
    // a story has none — not the design's demo entries. (The editor shows its
    // own items, so it keeps what its lists put there.)
    const guestView = !isEditMode.value;

    // Agenda -> schedule timeline
    if (Array.isArray(data.agenda) && (data.agenda.length || guestView)) {
      const sorted = [...data.agenda].sort(
        (a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || '')
      );
      config.scheduleEvents = sorted.map((a) => {
        const time = a.time || a.startTime || '';
        const parts = time.match(/^(\d+:\d+)\s*(AM|PM)?$/i);
        const typeKey = a.agendaType || a.type || '';
        const timeValue = parts ? parts[1] : time;
        const timePeriod = parts ? (parts[2] || '') : '';
        return {
          time:        timePeriod ? `${timeValue} ${timePeriod}` : timeValue,
          timeValue,
          timePeriod,
          title:       typeKey ? t('agenda.types.' + typeKey) : '',
          description: a.description || '',
        };
      });
    }

    // Our Story
    const ourStoryImages = Array.isArray(data.ourStoryImages) ? data.ourStoryImages : [];
    serverStoryImageCount.value = ourStoryImages.length;
    photos.setServer('story', ourStoryImages);
    if (Array.isArray(data.ourStory) && (data.ourStory.length || guestView)) {
      config.stories = data.ourStory.map((s, i) => {
        const desc = localized(s.descriptionI18n, s.description);
        const storyType = s.storyType || s.type || '';
        const hideTitle = s.showTitle === false;
        const title = hideTitle ? '' : (storyType ? t('storyTypes.' + storyType) : localized(s.titleI18n, s.title));
        return {
          imageUrl:    ourStoryImages[i] || s.imageUrl || '',
          date:        s.date || '',
          title,
          description: desc,
          text:        desc,
        };
      });
      // Parisian uses paragraphs format
      const isBuilderRoute = (route.params.design || route.query.design) === 'my-wedding';
      config.storyParagraphs = config.stories
        .map(s => {
          // Builder: description only (no title prefix)
          if (isBuilderRoute) return s.description || '';
          return s.title && s.description ? `${s.title} — ${s.description}` : s.description || s.title || '';
        })
        .filter(Boolean);
    }
    // Story photos for Persian family (separate photo grid)
    if (ourStoryImages.length) {
      config.storyPhotos = ourStoryImages.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
      if (!config.storyImageUrl && ourStoryImages[0]) {
        config.storyImageUrl = ourStoryImages[0];
      }
    }

    // Collage/gallery photos from backend
    const collageImages = Array.isArray(data.collageImages) ? data.collageImages : [];
    photos.setServer('collage', collageImages);
    if (collageImages.length) {
      config.galleryPhotos = collageImages.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }

    // RSVP
    // The line itself is worked out by refreshRsvpMessage (INV-401) from the
    // deadline, else the event's date.
    serverRsvpDeadline.value = ev.rsvpDeadline || '';

    // ---- Apply saved theme/config from public endpoint ----
    // Only for builder ("my-wedding") — preset templates keep their own defaults.
    const theme = data.theme;
    const applyDesign = route.params.design === 'my-wedding' || route.query.design === 'my-wedding';
    if (theme && applyDesign) {
      if (theme.rootBg) rootBg.value = theme.rootBg;
      if (theme.palette) Object.assign(palette, theme.palette);
      if (theme.fonts) {
        Object.assign(fonts, theme.fonts);
        loadGoogleFont(extractFontName(fonts.heading));
        loadGoogleFont(extractFontName(fonts.body));
      }
      if (theme.buttonStyle)    Object.assign(buttonStyle, theme.buttonStyle);
      if (theme.cardStyle)      Object.assign(cardStyle, theme.cardStyle);
      if (theme.spacingPreset)  spacingPreset.value = theme.spacingPreset;
      if (theme.heroFamily)     heroFamily.value = theme.heroFamily;
      if (theme.detailsFamily)  detailsFamily.value = theme.detailsFamily;
      if (theme.scheduleFamily) scheduleFamily.value = theme.scheduleFamily;
      if (theme.storyFamily)    storyFamily.value = theme.storyFamily;
    }

    if (data.rsvpConfig) Object.assign(rsvpConfig, data.rsvpConfig);

    if (data.entry && applyDesign) {
      entryType.value  = data.entry.type   || entryType.value;
      entryDesign.value = data.entry.design || entryDesign.value;
    }

    if (data.sectionOrder) {
      const order = Object.entries(data.sectionOrder)
        .sort(([, a], [, b]) => a - b)
        .map(([k]) => k);
      loadSectionState({
        order,
        visibility: data.sectionVisibility || {},
        layouts:    data.sectionLayouts || {},
      });
    }
  }

  /* ================================================================ */
  /*  Gallery images                                                  */
  /* ================================================================ */

  async function loadGalleryImages() {
    if (!eventId) return;
    try {
      const raw = await mediaService.list(eventId, { page: 0, size: 30 });
      const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
      const imageUrls = items
        .filter((m) => m.fileType?.startsWith('image'))
        .map((m) => m.fileUrl || m.url)
        .filter(Boolean);
      if (!imageUrls.length) return;

      if (!config.heroPhotoUrl) {
        config.heroPhotoUrl = imageUrls[0];
      }

      if (!config.galleryPhotos.length) {
        config.galleryPhotos = imageUrls.slice(0, 6).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
      }
    } catch (e) {
      console.error('Gallery fetch failed:', e);
    }
  }

  /* ================================================================ */
  /*  Refresh all data                                                */
  /* ================================================================ */

  function refreshAllData() {
    const run = readEvent();
    eventLoadPromise = run.then(() => {}, () => {});
    return run;
  }

  async function readEvent() {
    // INV-403: once read, the event's data stays on screen even if a later
    // re-read fails; until then a failed read stops every save of it.
    if (eventId && eventLoad.value !== 'loaded') eventLoad.value = 'loading';
    eventReadError.value = null;
    const data = await fetchData();
    if (data) {
      backendData.value = data;
      const defaultHero = config.heroPhotoUrl;
      config.heroPhotoUrl = '';
      applyBackendData(data);
      await loadGalleryImages();
      if (!config.heroPhotoUrl) config.heroPhotoUrl = defaultHero;
      if (eventId) eventLoad.value = 'loaded';
    } else if (eventId && eventLoad.value !== 'loaded') {
      // A failed request; a successful answer without a body is an event
      // with nothing to show (as for the sections, INV-402), not a failure.
      eventLoad.value = eventReadError.value ? 'failed' : 'loaded';
    }
  }

  /** Reads the event again after a failed read ("Load again"). */
  async function reloadEvent() {
    await refreshAllData();
    return eventLoad.value !== 'failed';
  }

  refreshCallback.value = refreshAllData;

  /* ================================================================ */
  /*  Draft save / load                                               */
  /* ================================================================ */

  // The couple's details typed in the editor. Kept with the local draft so a
  // reload restores them, not just the colours (IVY-INV-301).
  function draftInfo() {
    return {
      brideName:       config.brideName,
      groomName:       config.groomName,
      weddingDateTime: config.weddingDateTime,
      eventTimezone:   config.eventTimezone,
      venue:           config.venue,
      location:        config.location,
      locationLat:     config.locationLat,
      locationLng:     config.locationLng,
      locationMapUrl:  config.locationMapUrl,
      heroLabel:       config.heroLabel,
    };
  }

  /**
   * The basics typed in the editor, mirrored into the onboarding store so the
   * design picker shows the same names, date and place (INV-104).
   */
  function mirrorBasicsToOnboarding() {
    // Demo names of a design nobody personalised are not the user's basics.
    if (!basicsKnown.value) return;
    const couple = usesCoupleNames(onboardingStore.selectedCategory);
    const previous = normalizeBasics(onboardingStore.eventDetails);
    const wall = config.weddingDateTime || '';
    setEventDetails({
      ...previous,
      brideName: couple ? config.brideName || '' : previous.brideName,
      groomName: couple ? config.groomName || '' : previous.groomName,
      title:     couple ? previous.title : config.brideName || '',
      date:      /^\d{4}-\d{2}-\d{2}/.test(wall) ? wall.slice(0, 10) : previous.date,
      time:      /T\d{2}:\d{2}/.test(wall) ? wall.slice(11, 16) : previous.time,
      timezone:  config.eventTimezone || previous.timezone,
      location:  { name: config.venue || '', address: config.location || '' },
    });
  }

  function saveThemeToDraft() {
    if (!isAuthenticated() || !editEventId.value) {
      mirrorBasicsToOnboarding();
      setDraftTheme({
        info:          draftInfo(),
        rootBg:        rootBg.value,
        palette:       { ...palette },
        fonts:         { ...fonts },
        buttonStyle:   { ...buttonStyle },
        cardStyle:     { ...cardStyle },
        spacingPreset: spacingPreset.value,
        rsvpConfig:    { ...rsvpConfig },
        heroFamily:    heroFamily.value,
        detailsFamily: detailsFamily.value,
        scheduleFamily: scheduleFamily.value,
        storyFamily:   storyFamily.value,
      });
      setDraftSectionState({
        ...getSectionState(),
        advanced: { ...sectionAdvancedState },
      });
    }
  }

  function loadThemeFromDraft(invConfig) {
    let theme, rsvpData, entry, sectionState;

    if (invConfig) {
      // Authenticated: from BE event DTO
      theme    = invConfig.theme;
      rsvpData = invConfig.rsvpConfig;
      entry    = invConfig.entry;
      if (invConfig.sectionOrder) {
        const order = Object.entries(invConfig.sectionOrder)
          .sort(([, a], [, b]) => a - b)
          .map(([k]) => k);
        sectionState = {
          order,
          visibility: invConfig.sectionVisibility || {},
          layouts:    invConfig.sectionLayouts || {},
        };
      }
    } else if (!isAuthenticated() || !editEventId.value) {
      // Guest (or a new event not created yet): from localStorage draft
      theme        = getDraftTheme();
      sectionState = getDraftSectionState();
      // The draft's own info, else the basics entered before the design was
      // chosen (INV-104) — either way the user's names, not the demo couple.
      const basics = onboardingStore.eventDetails;
      const category = onboardingStore.selectedCategory;
      const info = theme?.info || (hasBasics(basics, category) ? basicsToInvitationInfo(basics, category) : null);
      if (info) {
        basicsKnown.value = true;
        if (info.brideName) config.brideName = info.brideName;
        // A title-only event has no second name; an empty one is deliberate.
        if (info.groomName !== undefined) config.groomName = info.groomName || '';
        if (isValidTimeZone(info.eventTimezone)) config.eventTimezone = info.eventTimezone;
        if (info.weddingDateTime) {
          config.weddingDateTime = info.weddingDateTime;
          config.weddingDate = formatDate(info.weddingDateTime);
          config.weddingTime = formatTime(info.weddingDateTime);
        }
        if (info.venue) config.venue = info.venue;
        if (info.location) config.location = info.location;
        if (info.locationLat != null) config.locationLat = info.locationLat;
        if (info.locationLng != null) config.locationLng = info.locationLng;
        if (info.locationMapUrl) {
          config.locationMapUrl = info.locationMapUrl;
          config.heroMapUrl = info.locationMapUrl;
        }
        if (info.heroLabel) config.heroLabel = info.heroLabel;
      }
    }

    const currentDesign = route.params.design || route.query.design;
    const isBuilder = currentDesign === 'my-wedding';

    // For preset templates: skip all theme overrides — always show preset defaults.
    // For builder ("my-wedding"): restore everything from saved theme.
    if (theme && isBuilder) {
      if (theme.palette) Object.assign(palette, theme.palette);
      if (theme.fonts) {
        Object.assign(fonts, theme.fonts);
        loadGoogleFont(extractFontName(fonts.heading));
        loadGoogleFont(extractFontName(fonts.body));
      }
      if (theme.rootBg)        rootBg.value = theme.rootBg;
      if (theme.buttonStyle)   Object.assign(buttonStyle, theme.buttonStyle);
      if (theme.cardStyle)     Object.assign(cardStyle, theme.cardStyle);
      if (theme.spacingPreset) spacingPreset.value = theme.spacingPreset;
      if (theme.heroFamily) heroFamily.value = theme.heroFamily;
      if (theme.detailsFamily) detailsFamily.value = theme.detailsFamily;
      if (theme.scheduleFamily) scheduleFamily.value = theme.scheduleFamily;
      if (theme.storyFamily) storyFamily.value = theme.storyFamily;
    }
    if (rsvpData || theme?.rsvpConfig) Object.assign(rsvpConfig, rsvpData || theme.rsvpConfig);
    if (entry && isBuilder) {
      entryType.value  = entry.type   || entryType.value;
      entryDesign.value = entry.design || entryDesign.value;
    }
    if (sectionState) {
      loadSectionState(sectionState);
      if (sectionState.advanced) Object.assign(sectionAdvancedState, sectionState.advanced);
    }
  }

  /* ================================================================ */
  /*  Global save                                                     */
  /* ================================================================ */

  /** The entries of a section to save, or null when it must be left out (INV-402). */
  function sectionToSend(key, items) {
    if (isAuthenticated() && editEventId.value && !isSectionLoaded(key)) return null;
    return withoutUnsavedExamples(items, key);
  }

  function currentPayloadArgs() {
    return {
      // INV-403: an existing event that was not read — its names, date,
      // place and settings on screen are the design's demo, never sent.
      eventLoaded:       eventLoad.value !== 'failed' && eventLoad.value !== 'loading',
      config,
      rootBg: rootBg.value,
      palette,
      fonts,
      buttonStyle,
      cardStyle,
      spacingPreset:     spacingPreset.value,
      rsvpConfig,
      entryType:         entryType.value,
      entryDesign:       entryDesign.value,
      sectionOrder:      sectionOrder.value,
      sectionVisibility: sectionVisibility.value,
      sectionLayouts:    { ...sectionLayouts },
      // INV-401: a design's examples shown in an empty section of an existing
      // event are not the person's content — never sent as such.
      // INV-402: a section of an existing event that was not read from the
      // server is left out (null), never sent as an empty list.
      eventDetailItems:  sectionToSend('eventDetails', eventDetails.items.value),
      agendaItems:       sectionToSend('agenda', agenda.items.value),
      ourStoryItems:     sectionToSend('ourStory', ourStory.items.value),
      invitationName:    route.params.design || preset.id,
      lang:              locale.value,
      // An existing event keeps its own category; a new one takes what was
      // chosen in onboarding (INV-104) — not always a wedding.
      categoryType:      backendData.value?.event?.eventCategory || onboardingStore.selectedCategory || 'WEDDING',
      typeCode:          editEventId.value ? undefined : onboardingStore.selectedTypeCode || undefined,
      timezone:          config.eventTimezone,
      heroFamily:        heroFamily.value,
      detailsFamily:     detailsFamily.value,
      scheduleFamily:    scheduleFamily.value,
      storyFamily:       storyFamily.value,
    };
  }

  /* ================================================================ */
  /*  Autosave (IVY-INV-301)                                          */
  /* ================================================================ */
  //
  // Where each state lives:
  //  - guest, or signed in without an event yet → the local draft
  //    (invitationDraft.store): "saved on this device". The event is created
  //    on sign-up / on the explicit Save, with the draft's idempotency key.
  //  - existing event → PUT /events/full/{id} (a full replacement, safe to
  //    repeat). A copy of what is being sent is kept per event until the
  //    server confirms it, so a failure or a closed tab loses nothing.

  // Signed in, no event yet: the server create happens on the explicit Save
  // only — autosave never makes an event nobody asked for.
  const createRequested = ref(false);
  // A copy left unsynced by an earlier visit to this event.
  const unsyncedFromBefore = ref(null);

  function autosaveSnapshot() {
    const payload = buildEventFullPayload(currentPayloadArgs());
    // INV-403: an existing event's story / collage photos are named slot by
    // slot, so replacing or removing one keeps the others.
    const photoSnap = photos.snapshot({ layout: isAuthenticated() && !!editEventId.value });
    return {
      payload,
      photos: photoSnap,
      files: photoSnap.files,
    };
  }

  // INV-502: the last write to this device failed (storage full / blocked) —
  // a draft's latest changes then exist only in memory.
  let deviceCopyFailed = false;

  function persistLocally(snap) {
    try {
      writeLocalCopy(snap);
      deviceCopyFailed = false;
    } catch (err) {
      deviceCopyFailed = true;
      throw err;
    }
  }

  function writeLocalCopy(snap) {
    if (isAuthenticated() && editEventId.value) {
      saveUnsyncedSnapshot(editEventId.value, snap.payload);
      unsyncedFromBefore.value = null;
      return;
    }
    saveThemeToDraft();
    setDraftFullPayload({ ...snap.payload, clientRequestId: getDraftClientRequestId() });
    // Picked photos cannot be written to this device; remember how many, so
    // they are asked for again after sign-in rather than lost unannounced.
    setDraftPendingFiles(pickedPhotoCounts());
  }

  function pickedPhotoCounts() {
    return photos.counts();
  }

  /** Photos picked in this visit that exist only in memory (guest / not created yet). */
  const unsavedPhotoCount = computed(() => {
    const c = pickedPhotoCounts();
    return c.hero + c.story + c.collage;
  });

  async function syncToServer(snap) {
    const creating = !editEventId.value;
    // INV-402: a section that could not be read is never saved over. Nothing
    // goes to the server until it is read again ("Try again").
    // INV-403: the same for the event itself — when it could not be read,
    // what is on screen is the design's demo, not the event.
    if (!creating) {
      await Promise.all([whenSectionsSettled(), eventLoadPromise]);
      const failed = [...(eventLoad.value === 'failed' ? ['event'] : []), ...failedSections.value];
      if (failed.length) {
        photos.markFailed(snap.photos, null, { held: true });
        throw new SectionsNotLoadedError(failed);
      }
    }
    // INV-303: the create is recorded before it is sent, so a lost answer is
    // resent with the same key on this account's next sign-in.
    if (creating) markDraftCreateSent(currentAccount());
    let result;
    // The photo layout travels only with the request — never in the local
    // copy, which cannot hold the files it refers to.
    const body = snap.photos?.slots ? { ...snap.payload, ...snap.photos.slots } : snap.payload;
    const withPhotos = !!snap.photos?.sent?.length;
    photos.markUploading(snap.photos);
    try {
      result = await saveFullEvent(
        body,
        snap.files || {},
        {
          ...(creating ? { clientRequestId: getDraftClientRequestId() } : {}),
          ...(withPhotos ? {
            onUploadProgress: (e) => {
              if (e?.total) photos.setProgress(snap.photos, Math.min(100, Math.round((e.loaded / e.total) * 100)));
            },
          } : {}),
        },
      );
    } catch (e) {
      photos.markFailed(snap.photos, e);
      // The key belongs to another account's event (a shared device): a new
      // key, so the next explicit try creates this account's own event.
      if (creating && isClaimedKeyError(e)) renewDraftClientRequestId();
      throw e;
    }
    // The draft became an event; its key must not be reused for another one.
    if (creating) clearDraft();
    return result;
  }

  const autosave = createAutosave({
    snapshot: autosaveSnapshot,
    persistLocal: persistLocally,
    clearLocal: () => { if (editEventId.value) clearUnsyncedSnapshot(editEventId.value); },
    sync: syncToServer,
    canSync: () => isAuthenticated() && (!!editEventId.value || createRequested.value),
    onSynced: (result, snap) => {
      if (snap.photos) {
        photos.markSaved(snap.photos, result);
        showHeroPreview();
      }
      if (!snap.restored) adoptSavedIds(result, snap.payload);
    },
  });

  const saveStatus = autosave.status;
  const lastSyncedAt = autosave.lastSyncedAt;

  /** Which "saved on this device" it is — the message differs. */
  const saveStatusDetail = computed(() => {
    // INV-402: saving is held back until the sections are read again.
    if (saveStatus.value === SAVE_STATUS.ERROR && isSectionsNotLoaded(autosave.lastError.value)) return 'sectionsNotLoaded';
    if (saveStatus.value !== SAVE_STATUS.LOCAL) return null;
    if (unsyncedFromBefore.value) return 'previous';
    return isAuthenticated() ? 'notCreated' : 'guest';
  });

  onChange(() => {
    if (isEditMode.value) autosave.schedule();
  });

  // Only a confirmed save clears "unsaved changes".
  watch(saveStatus, (s) => {
    if (s === SAVE_STATUS.SYNCED) clearDirty();
  });

  /* ================================================================ */
  /*  Undo / redo in this visit (INV-801)                             */
  /* ================================================================ */
  //
  // What can be undone — each a field of the history (useEditHistory): the
  // names, the date and time, the zone, the place, the RSVP settings, which
  // sections show, the layout (order, layouts, section styles), the colours,
  // the fonts, the opening animation, and the entries of details, programme
  // and story. Not photos: a picked photo, an upload in progress and what the
  // server stored stay as they are (the slots have their own remove/restore).
  //
  // Undo is not a saved version. It writes the earlier values back and they
  // are saved like any other change: the device copy at once, an existing
  // event with the next PUT /events/full — a full replacement, so an entry
  // created or deleted on the server since is put right by that save. The
  // save status says "Saving…" until the server confirms it.

  const pickFrom = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? null]));
  const replaceIn = (obj, value) => {
    Object.keys(obj).forEach((k) => { if (!(k in value)) delete obj[k]; });
    Object.assign(obj, value);
  };
  const WHEN_FIELDS = ['weddingDateTime', 'weddingDate', 'weddingTime'];
  const PLACE_FIELDS = ['venue', 'location', 'locationLat', 'locationLng', 'locationMapUrl', 'heroMapUrl'];
  const serverBacked = () => isAuthenticated() && !!editEventId.value;

  /** A section's entries: what counts is the content, not the ids a save gives. */
  function entriesField(section, listRef) {
    return {
      read: () => listRef.value,
      content: (list) => (list || []).map(({ id, _localId, ...rest }) => rest),
      write: (list) => {
        if (serverBacked()) {
          // The id the entry has now (a save since may have given it a new one).
          // An entry deleted since keeps its old id: the next save creates it again.
          listRef.value = list.map((item) => (item.id ? { ...item, id: currentIdOf(item.id) } : item));
          return;
        }
        // A draft: its entries live on this device too.
        const local = list.map((item) => {
          const localId = item._localId || (String(item.id || '').startsWith('_local_') ? item.id : generateLocalId());
          return { ...item, _localId: localId, id: localId };
        });
        listRef.value = local;
        replaceDraftItems(section, local);
      },
    };
  }

  const HISTORY_FIELDS = {
    names:    { read: () => pickFrom(config, ['brideName', 'groomName']), write: (v) => Object.assign(config, v) },
    when:     { read: () => pickFrom(config, WHEN_FIELDS), write: (v) => Object.assign(config, v) },
    timezone: { read: () => config.eventTimezone, write: (v) => { config.eventTimezone = v; } },
    place:    { read: () => pickFrom(config, PLACE_FIELDS), write: (v) => Object.assign(config, v) },
    rsvp:     { read: () => rsvpConfig, write: (v) => replaceIn(rsvpConfig, v) },
    visibility: { read: () => sectionVisibility.value, write: (v) => { sectionVisibility.value = v; } },
    layout: {
      read: () => ({
        order: sectionOrder.value,
        layouts: sectionLayouts,
        families: { hero: heroFamily.value, details: detailsFamily.value, schedule: scheduleFamily.value, story: storyFamily.value },
      }),
      write: (v) => {
        sectionOrder.value = v.order;
        replaceIn(sectionLayouts, v.layouts || {});
        heroFamily.value = v.families.hero;
        detailsFamily.value = v.families.details;
        scheduleFamily.value = v.families.schedule;
        storyFamily.value = v.families.story;
      },
    },
    colors: {
      read: () => ({ rootBg: rootBg.value, palette, buttonStyle, cardStyle, spacingPreset: spacingPreset.value }),
      write: (v) => {
        rootBg.value = v.rootBg;
        replaceIn(palette, v.palette);
        replaceIn(buttonStyle, v.buttonStyle);
        replaceIn(cardStyle, v.cardStyle);
        spacingPreset.value = v.spacingPreset;
      },
    },
    fonts: {
      read: () => fonts,
      write: (v) => {
        replaceIn(fonts, v);
        loadGoogleFont(extractFontName(fonts.heading || ''));
        loadGoogleFont(extractFontName(fonts.body || ''));
      },
    },
    entry: {
      read: () => ({ type: entryType.value, design: entryDesign.value }),
      write: (v) => { entryType.value = v.type; entryDesign.value = v.design; },
    },
    details: entriesField('eventDetails', eventDetails.items),
    agenda:  entriesField('agenda', agenda.items),
    ourStory: entriesField('ourStory', ourStory.items),
  };

  // What a step is called ("Undo: Programme"): its most specific field.
  const HISTORY_LABELS = {
    names: 'editSection.history.what.names',
    when: 'editSection.history.what.when',
    timezone: 'editSection.history.what.timezone',
    place: 'editSection.history.what.place',
    details: 'editSection.controls.details',
    agenda: 'editSection.controls.agendaList',
    ourStory: 'editSection.controls.ourStoryList',
    rsvp: 'editSection.controls.rsvp',
    entry: 'editSection.controls.entry',
    colors: 'editSection.controls.colors',
    fonts: 'editSection.controls.fonts',
    layout: 'editSection.history.what.layout',
    visibility: 'editSection.history.what.visibility',
  };
  const HISTORY_PRIORITY = Object.keys(HISTORY_LABELS);
  const SECTION_OF_FIELD = { details: 'eventDetails', agenda: 'agenda', ourStory: 'ourStory' };
  const EVENT_FIELDS = new Set(['names', 'when', 'timezone', 'place', 'rsvp', 'visibility']);

  function historyWhat(step) {
    if (!step) return '';
    const key = HISTORY_PRIORITY.find((k) => step.keys.includes(k)) || step.keys[0];
    return t(HISTORY_LABELS[key]);
  }

  const historyAnnouncement = ref('');
  const historyListeners = new Set();
  /** Called after undo / redo wrote values back (the page resets its own view of them). */
  function onHistoryRestored(fn) {
    historyListeners.add(fn);
    return () => historyListeners.delete(fn);
  }

  const editHistory = createEditHistory({
    fields: HISTORY_FIELDS,
    // Never written back over what could not be read (INV-402 / INV-403):
    // the next save would then replace the stored content with it.
    isRestorable: (key) => {
      if (SECTION_OF_FIELD[key]) return isSectionLoaded(SECTION_OF_FIELD[key]);
      if (EVENT_FIELDS.has(key)) return eventLoad.value !== 'failed';
      return true;
    },
    onRestored: (step, direction) => {
      // A change like any other: unsaved until a save confirms it — never
      // shown as saved because it matches an earlier state.
      markDirty();
      if (serverBacked()) autosave.flush();
      const text = t(direction === 'undo' ? 'editSection.history.undone' : 'editSection.history.redone', { what: historyWhat(step) });
      historyAnnouncement.value = '';
      nextTick(() => { historyAnnouncement.value = text; });
      historyListeners.forEach((fn) => {
        try { fn(step, direction); } catch (e) { console.warn('[history] listener failed', e); }
      });
    },
  });
  setEditTracker(editHistory);
  editHistory.start();

  const historyState = computed(() => ({
    canUndo: editHistory.canUndo.value,
    canRedo: editHistory.canRedo.value,
    undoWhat: historyWhat(editHistory.nextUndo.value),
    redoWhat: historyWhat(editHistory.nextRedo.value),
    announcement: historyAnnouncement.value,
  }));

  function undoEdit() {
    return isEditMode.value ? editHistory.undo() : null;
  }
  function redoEdit() {
    return isEditMode.value ? editHistory.redo() : null;
  }

  /**
   * Another design (INV-203): its look replaces the style, so steps about the
   * style no longer apply. Content steps (names, entries, RSVP…) stay.
   */
  function forgetStyleHistory() {
    editHistory.forget(['colors', 'fonts', 'entry', 'layout', 'visibility']);
  }

  async function reloadAfterRestore() {
    await refreshAllData();
    const invConfig = await fetchInvitationConfig();
    if (invConfig) loadThemeFromDraft(invConfig);
    await loadEditData();
  }

  /** Resend after a failure — or send the copy an earlier visit left unsynced. */
  async function retrySave() {
    // INV-403: the event itself first, when it could not be read.
    if (eventLoad.value === 'failed') {
      const loaded = await reloadEvent();
      if (!loaded) return autosave.retry();
    }
    // INV-402: first read again what could not be read; only then save.
    if (failedSections.value.length) {
      const loaded = await retryFailedSections();
      if (!loaded) return autosave.retry();
    }
    const left = unsyncedFromBefore.value;
    if (left) {
      const outcome = await autosave.retry({
        snapshot: () => ({ payload: left.payload, files: {}, restored: true }),
      });
      if (outcome.synced) {
        unsyncedFromBefore.value = null;
        await reloadAfterRestore();
      }
      return outcome;
    }
    return autosave.retry();
  }

  async function onGlobalSave() {
    if (isAuthenticated()) {
      createRequested.value = true;
      let outcome = await autosave.flush();
      // A change made while that save ran is still waiting — send it too.
      if (outcome.synced && autosave.isPending()) outcome = await autosave.flush();
      if (outcome.synced) {
        clearDirty();
        await router.push({ name: 'dashboard.overview', params: { lang: locale.value } });
      } else if (isSectionsNotLoaded(outcome.error)) {
        toast.error(t('editSection.sectionStates.loadFailed.saveBlocked'));
      } else if (outcome.error) {
        toast.apiError(outcome.error);
      }
      return;
    }
    // Guest: keep everything on this device (with the idempotency key) and
    // ask for an account only now, at the final action (INV-104). The dialog
    // says the draft is in this browser only; cancelling keeps editing.
    await autosave.flush();
    authGateOpen.value = true;
  }

  /* ================================================================ */
  /*  Sign-up / sign-in at the final action (INV-104)                 */
  /* ================================================================ */

  const authGateOpen = ref(false);

  function closeAuthGate() {
    authGateOpen.value = false;
  }

  /** To sign-up or sign-in with the draft; it is created there (useDraftSync). */
  async function continueToAuth(kind) {
    await autosave.flush();
    authGateOpen.value = false;
    // The draft is on this device; leaving is not losing it.
    clearDirty();
    router.push({ name: kind === 'login' ? 'login' : 'signup', params: { lang: locale.value } });
  }

  // Arriving back from sign-in with a draft: ?resume=choose (the account
  // already has an event — never created or merged on its own) or
  // ?resume=failed (the create did not go through). ?photos=N: photos picked
  // before signing in that have to be added again.
  const resumeMode = ref(['choose', 'failed'].includes(route.query.resume) ? route.query.resume : null);
  // Why it asks (INV-303): the account has events (default), could not be
  // checked, or the draft was already saved by another account on this device.
  const resumeConflict = ref(Object.values(RESUME_CONFLICT).includes(route.query.conflict) ? route.query.conflict : RESUME_CONFLICT.EVENTS);
  const photosToReAdd = ref(Math.max(0, parseInt(route.query.photos, 10) || 0));

  function dropResumeQuery(keys) {
    const query = { ...route.query };
    keys.forEach((k) => delete query[k]);
    router.replace({ query }).catch(() => {});
  }

  /** "Save as a new event" / "Try again": the explicit save, nothing else. */
  async function saveDraftAsNewEvent() {
    resumeMode.value = null;
    await onGlobalSave();
    if (saveStatus.value !== SAVE_STATUS.SYNCED) resumeMode.value = 'failed';
  }

  /** "Keep it on this device for now". */
  function keepDraftForLater() {
    resumeMode.value = null;
    dropResumeQuery(['resume', 'conflict']);
  }

  /**
   * "Discard this draft" — only after the dialog's confirmation, which names
   * what goes (INV-302). The same deletion as the start page's: the draft and
   * the type/basics/design chosen for it; events in the account stay.
   */
  async function discardDraft() {
    discardLocalDraft();
    resumeMode.value = null;
    clearDirty();
    router.push(await landingAfterAuth(locale.value));
  }

  function dismissPhotosNotice() {
    photosToReAdd.value = 0;
    dropResumeQuery(['photos']);
  }

  /**
   * Writes what is pending before the editor is left for another step of the
   * flow (INV-102) or the preview. A draft is on this device, an event in the
   * account; either way nothing is lost by leaving, so no "unsaved" prompt.
   */
  async function flushBeforeLeaving() {
    await autosave.flush();
    if (!editEventId.value || saveStatus.value === SAVE_STATUS.SYNCED) clearDirty();
  }

  /* ================================================================ */
  /*  Leaving with unsaved changes (INV-502)                          */
  /* ================================================================ */

  /**
   * What leaving now would lose, if anything:
   *  - 'event' — an existing event with a change from this visit that the
   *    server has not confirmed (waiting, failed, offline, held by INV-402);
   *  - 'draft' — a draft whose latest change could not be written to this
   *    device. A draft that was written is not lost by leaving (INV-102).
   * Nothing after a confirmed save.
   */
  function unsavedOnLeave() {
    if (!changed.value) return null;
    if (isAuthenticated() && editEventId.value) {
      return saveStatus.value === SAVE_STATUS.SYNCED ? null : 'event';
    }
    return deviceCopyFailed ? 'draft' : null;
  }

  const leavePrompt = reactive({ open: false, kind: 'event', busy: false, failed: false });
  let leaveResolve = null;

  function askToLeave() {
    leavePrompt.kind = unsavedOnLeave() || 'event';
    leavePrompt.busy = false;
    leavePrompt.failed = false;
    leavePrompt.open = true;
    // The navigation waits on a question, not on loading: the route loader
    // (started by the app's guard) would cover the dialog.
    stopLoading();
    return new Promise((resolve) => { leaveResolve = resolve; });
  }

  function answerLeave(leave) {
    leavePrompt.open = false;
    leavePrompt.busy = false;
    if (leave) startLoading();
    const resolve = leaveResolve;
    leaveResolve = null;
    resolve?.(leave);
  }

  /** "Keep editing". */
  function stayInEditor() {
    if (!leavePrompt.busy) answerLeave(false);
  }

  /** "Save and exit": leaves only once the save is confirmed. */
  async function saveAndLeave() {
    if (leavePrompt.busy) return;
    leavePrompt.busy = true;
    leavePrompt.failed = false;
    try {
      if (leavePrompt.kind === 'event') {
        const outcome = await retrySave();
        // A change made while that save ran is still waiting — send it too.
        if (outcome?.synced && autosave.isPending()) await autosave.flush();
      } else {
        await autosave.flush();
      }
    } catch (err) {
      console.warn('[invitation] save before leaving failed', err);
    }
    if (!leavePrompt.open) return;
    if (!unsavedOnLeave()) {
      answerLeave(true);
    } else {
      leavePrompt.busy = false;
      leavePrompt.failed = true;
    }
  }

  /** "Discard changes": nothing waiting is written; the device copy goes. */
  function discardAndLeave() {
    if (leavePrompt.busy) return;
    autosave.dispose();
    if (leavePrompt.kind === 'event' && editEventId.value) clearUnsyncedSnapshot(editEventId.value);
    answerLeave(true);
  }

  let removeLeaveGuard = null;
  function guardLeaving() {
    removeLeaveGuard = setupUnsavedGuard(router, {
      isUnsaved: () => !!unsavedOnLeave(),
      // Write what is waiting first; a change that saves needs no question.
      settle: async () => {
        if (autosave.hasScheduled()) await autosave.flush();
        else await autosave.whenIdle();
      },
      // A closing tab: the device copy is written synchronously; the server
      // save may not finish, so an event still asks (the browser's own text).
      beforeUnload: () => { if (autosave.hasScheduled()) autosave.flush(); },
      confirmLeave: askToLeave,
    });
  }

  /** The invitation as a guest will see it — the draft, without the editor. */
  async function openGuestPreview() {
    await flushBeforeLeaving();
    const query = { ...route.query, preview: '1' };
    delete query.edit;
    delete query.step;
    if (editEventId.value) { query.eventId = editEventId.value; delete query.new; }
    router.push({ path: route.path, query });
  }

  /** Back from the preview: the same page, so the draft in it stays (INV-602). */
  function backToEditor() {
    const query = { ...route.query, edit: 'true' };
    delete query.preview;
    delete query.step;
    delete query.isPrivate;
    return router.push({ path: route.path, query });
  }

  /** Previewing an unsaved draft: the page shows the way back to the editor. */
  const isDraftPreview = computed(() => !isEditMode.value && route.query.preview === '1');

  onBeforeUnmount(() => {
    // INV-502: the guard and the unload listener go with the editor.
    removeLeaveGuard?.();
    removeLeaveGuard = null;
    editHistory.dispose();
    if (leaveResolve) answerLeave(false);
    // A debounced change not yet written: write it now rather than drop it.
    if (autosave.hasScheduled()) autosave.flush();
    autosave.dispose();
  });

  /* ================================================================ */
  /*  RSVP submit                                                     */
  /* ================================================================ */

  /**
   * Sends a guest's RSVP. A failure is thrown, not swallowed: the form shows
   * it and keeps the answers. Swallowing it here was what made the form thank
   * a guest whose reply never arrived.
   */
  async function onRsvpSubmit(payload) {
    if (!eventId) return;
    await rsvpService.submitRsvp(eventId, payload);
    const names = payload.guests ? payload.guests.map(g => g.fullName) : [];
    router.push({
      name: 'RsvpSuccessSubmitPage',
      params: { lang: route.params.lang || 'mk' },
      query: { names: JSON.stringify(names) },
    });
  }

  /* ================================================================ */
  /*  Watchers                                                        */
  /* ================================================================ */

  // Auto-open entry section when entry overlay is visible in edit mode
  watch(showEntry, (visible) => {
    if (!isEditMode.value) return;
    if (visible) {
      toggleSection('entry');
    } else if (activeRootSection.value === 'entry') {
      toggleSection('entry');
    }
  }, { immediate: true });

  // Show collage section only when gallery entry is selected
  watch(entryType, (type) => {
    sectionVisibility.value = { ...sectionVisibility.value, collage: type === 'gallery' };
  }, { immediate: true });

  // Sync composable items -> config so preview updates after CRUD
  watch(() => eventDetails.items.value, (items) => {
    if (!items.length) return;
    // Deduplicate by id + type combo
    const seen = new Set();
    const unique = items.filter(d => {
      const key = d.id || `${d.type}_${d.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const sorted = [...unique].sort(
      (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
    );
    const churchItem = sorted.find(d => d.type === 'CHURCH' || d.type === 'REGISTRATION');
    if (churchItem) {
      config.ceremonyDate   = churchItem.eventDate || '';
      config.ceremonyTime   = churchItem.time || '';
      config.ceremonyVenue  = t('detailTypes.' + churchItem.type);
      config.ceremonyMapUrl = buildMapUrl(churchItem.location);
    }
    const receptionItem = sorted.find(d => d.type === 'RECEPTION');
    if (receptionItem) {
      config.receptionDate   = receptionItem.eventDate || '';
      config.receptionTime   = receptionItem.time || '';
      config.receptionVenue  = t('detailTypes.' + receptionItem.type);
      config.receptionMapUrl = buildMapUrl(receptionItem.location);
    }
  }, { deep: true });

  // INV-602: the guest preview draws what guests get — an example that is
  // only on the editor's screen (an existing event's empty section, INV-401)
  // is never saved, so it is not drawn there.
  const forGuests = (items, section) => (isEditMode.value ? items : withoutUnsavedExamples(items, section));

  watch(() => [agenda.items.value, isEditMode.value], ([all]) => {
    const items = forGuests(all, 'agenda');
    // INV-402: an emptied programme is empty in the preview too — not the
    // design's demo schedule.
    if (!items.length) { config.scheduleEvents = []; return; }
    // Deduplicate by id + type+time combo
    const seen = new Set();
    const unique = items.filter(a => {
      const key = a.id || `${a.type || a.agendaType}_${a.time || a.startTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const sorted = [...unique].sort(
      (a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || '')
    );
    config.scheduleEvents = sorted.map(a => {
      const time = a.time || a.startTime || '';
      const parts = time.match(/^(\d+:\d+)\s*(AM|PM)?$/i);
      const typeKey = a.agendaType || a.type || '';
      const timeValue = parts ? parts[1] : time;
      const timePeriod = parts ? (parts[2] || '') : '';
      return {
        time:        timePeriod ? `${timeValue} ${timePeriod}` : timeValue,
        timeValue,
        timePeriod,
        title:       typeKey ? t('agenda.types.' + typeKey) : '',
        description: a.description || '',
      };
    });
  }, { deep: true });

  // The story photos the editor read with the story (INV-403: the slots).
  watch(() => ourStory.images?.value, (images) => {
    if (isEditMode.value && Array.isArray(images)) photos.setServer('story', images);
  });

  // Default placeholder images for stories (saved on init before watchers run)
  const _defaultStoryImages = config.stories.map(s => s.imageUrl);

  watch(() => [ourStory.items.value, isEditMode.value], ([all]) => {
    const items = forGuests(all, 'ourStory');
    if (!items.length) { config.stories = []; config.storyParagraphs = []; return; }
    config.stories = items.map((s, i) => {
      const desc = s.description || '';
      const sType = s.storyType || s.type || '';
      const hideTitle = s.showTitle === false;
      const title = hideTitle ? '' : (sType ? t('storyTypes.' + sType) : (s.title || ''));
      return {
        imageUrl:    s.imageUrl || _defaultStoryImages[i] || '',
        date:        s.storyDate || s.date || '',
        title,
        description: desc,
        text:        desc,
      };
    });
    // Parisian uses paragraphs format: title + description per story
    config.storyParagraphs = config.stories
      .map(s => s.title && s.description ? `${s.title} — ${s.description}` : s.description || s.title || '')
      .filter(Boolean);
  }, { deep: true });

  /* ================================================================ */
  /*  Scroll reveal                                                   */
  /* ================================================================ */

  useScrollReveal(rootRef);

  /* ================================================================ */
  /*  Reset preset (when navigating between designs)                  */
  /* ================================================================ */

  // INV-203: a design is only the look. Each design's style as it was left in
  // this visit (colours, fonts, layouts, opening), so switching back to a
  // design brings back what was changed there.
  const styleByDesign = new Map();

  function captureStyle() {
    return JSON.parse(JSON.stringify({
      rootBg: rootBg.value, palette, fonts, buttonStyle, cardStyle,
      spacingPreset: spacingPreset.value,
      entryType: entryType.value, entryDesign: entryDesign.value,
      heroFamily: heroFamily.value, detailsFamily: detailsFamily.value,
      scheduleFamily: scheduleFamily.value, storyFamily: storyFamily.value,
    }));
  }

  function applyStyle(s) {
    rootBg.value = s.rootBg;
    Object.assign(palette, s.palette);
    Object.assign(fonts, s.fonts);
    Object.assign(buttonStyle, s.buttonStyle);
    Object.assign(cardStyle, s.cardStyle);
    spacingPreset.value = s.spacingPreset;
    entryType.value = s.entryType;
    entryDesign.value = s.entryDesign;
    heroFamily.value = s.heroFamily;
    detailsFamily.value = s.detailsFamily;
    scheduleFamily.value = s.scheduleFamily;
    storyFamily.value = s.storyFamily;
  }

  /**
   * Shows the invitation in another design (INV-203). Only the look changes:
   * the new preset's colours, fonts, layouts and opening (or the ones this
   * design had earlier in the visit). Names, date, place, details, programme,
   * story, photos, RSVP settings and section visibility are not touched, and
   * nothing is fetched again — a refetch would replace changes that are not
   * saved yet with the server's copy.
   *
   * @param p    the new design's preset
   * @param from the design being left (its style is remembered)
   * @param to   the design being opened
   */
  function resetToPreset(p, { from, to } = {}) {
    if (from) styleByDesign.set(from, captureStyle());
    entryType.value = p.entryType || 'envelop';
    entryDesign.value = p.entryDesign || 'white-gold-seal';
    heroFamily.value = p.family || 'coastal';
    detailsFamily.value = p.family || 'coastal';
    scheduleFamily.value = p.family || 'coastal';
    storyFamily.value = p.family || 'coastal';
    rootBg.value = p.rootBg || '#fff';
    Object.assign(palette, p.palette);
    Object.assign(fonts, p.fonts);
    Object.assign(buttonStyle, p.buttonStyle);
    Object.assign(cardStyle, p.cardStyle);

    // Load fonts for new preset
    (p.fontUrls || []).forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    const remembered = to && styleByDesign.get(to);
    if (remembered) {
      applyStyle(remembered);
      loadGoogleFont(extractFontName(fonts.heading));
      loadGoogleFont(extractFontName(fonts.body));
    }
  }

  /* ================================================================ */
  /*  onMounted                                                       */
  /* ================================================================ */

  onMounted(async () => {
    // INV-502: registered before anything is awaited, so an editor that
    // unmounts early removes it again; it asks only after a change.
    guardLeaving();
    // Load preset fonts
    const fontLinks = preset.fontUrls || [];
    fontLinks.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    await refreshAllData();

    // Always load theme (colors, fonts, families) — both view and edit mode
    const invConfig = await fetchInvitationConfig();
    if (invConfig) loadThemeFromDraft(invConfig);
    else if (!editEventId.value && !eventId) {
      // No event behind this page: it is the visitor's own draft — in the
      // editor, or previewed as a guest will see it (INV-104).
      loadThemeFromDraft(null);
      if (!isEditMode.value) loadEditData();
    }

    if (isEditMode.value) {
      loadEditData();
      autosave.start();
      if (isAuthenticated() && editEventId.value) {
        const left = getUnsyncedSnapshot(editEventId.value);
        if (left) {
          unsyncedFromBefore.value = left;
          autosave.markLocal();
        }
      }
    }
  });

  /* ================================================================ */
  /*  Return                                                          */
  /* ================================================================ */

  return {
    // Template refs
    rootRef, entryRef,

    // State
    loading, config, palette, fonts, buttonStyle, cardStyle, spacingPreset, rsvpConfig,
    showEntry, entryActive, showAgenda, showOurStory, entryType, entryDesign, rootBg,
    heroFamily, detailsFamily, scheduleFamily, storyFamily,
    onHeroFamilyChange, onDetailsFamilyChange, onScheduleFamilyChange, onStoryFamilyChange,

    // Edit mode
    isEditMode, activeModal, activeRootSection, editingItem,
    openModal, closeModal, closeAllModals, selectSection,
    dirty, previewMode, markDirty, clearDirty, saving,
    saveStatus, saveStatusDetail, lastSyncedAt, retrySave,
    // INV-104: account only at the final action; resuming after sign-in
    authGateOpen, closeAuthGate, continueToAuth, unsavedPhotoCount,
    resumeMode, resumeConflict, photosToReAdd, saveDraftAsNewEvent, keepDraftForLater, discardDraft, dismissPhotosNotice,
    openGuestPreview, backToEditor, isDraftPreview, flushBeforeLeaving,
    // INV-502: leaving with unsaved changes
    leavePrompt, saveAndLeave, discardAndLeave, stayInEditor,
    // INV-801: undo / redo in this visit
    historyState, undoEdit, redoEdit, onHistoryRestored, forgetStyleHistory, editHistory,
    // The names/date/place are the user's own, not the design's demo (INV-102 stepper).
    basicsKnown,
    isNewUnsaved: computed(() => isEditMode.value && !editEventId.value),

    // INV-402: empty / hidden sections, and sections that could not be read
    sectionHasContent, setSectionShown, sectionLoad, failedSections,
    // INV-403: the event itself could not be read; the photo slots
    eventLoad, photos, pickPhoto, removePhoto, restorePhoto, brokenPhoto,

    // Sections
    orderedSections, sectionVisibility, sectionLayouts, sectionOverrides, sectionAdvancedState,
    isSectionVisible, toggleVisibility, toggleSection,
    SIDEBAR_SECTIONS, SECTION_LAYOUTS, sectionStatuses,

    // Data
    eventId, locale, isPrivate, backendData,
    agenda, eventDetails, ourStory,
    heroEventData, heroFile, ourStoryFiles, collageFiles,

    // Style
    rootStyle, colorFields, shadows, contrastCardBg,
    PALETTE_PRESETS: preset.palettePresets,
    SHADOW_MAP, SPACING_MAP,

    // Handlers
    onEntryChange, onHeroChange, onInfoChange,
    onColorsChange, onFontsChange, onRsvpChange,
    onButtonsChange, onBackgroundChange, onSpacingChange,
    onAdvancedUpdate, onGlobalSave,
    onDetailsAdd, onDetailsEdit, onDetailsDelete,
    onAgendaAdd, onAgendaEdit, onAgendaDelete,
    onOurStoryAdd, onOurStoryEdit, onOurStoryDelete,
    onRsvpSubmit,

    // Utilities
    t, formatDate, formatTime,
    extractFontName, loadGoogleFont,
    setLayout, markDirty,
    refreshAllData, resetToPreset,
    saveThemeToDraft, loadThemeFromDraft,

    // Edit-mode delegated handlers (for template wiring)
    handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
    handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
    handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,

    // OUR_STORY_FIELD_CONFIG reference (templates use preset.id to index)
    OUR_STORY_FIELD_CONFIG,
  };
}
