import { reactive, ref, onMounted, computed, watch } from 'vue';
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
} from '@/store/invitationDraft.store';
import { isAuthenticated } from '@/services/auth.service';
import { OUR_STORY_FIELD_CONFIG } from '@/config/ourStoryFieldConfig.js';
import { EventDetailTypeSortOrder } from '@/enums/EventDetailType';
import { buildEventFullPayload } from '@/utils/buildEventFullPayload';

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

/* ------------------------------------------------------------------ */
/*  Composable                                                        */
/* ------------------------------------------------------------------ */

export function useWeddingInvitation(preset) {
  /* ---- Core composables ------------------------------------------ */
  const { t, locale } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

  const {
    isEditMode, activeModal, activeRootSection, editingItem,
    openModal, closeModal, closeAllModals, selectSection, refreshCallback,
    agenda, eventDetails, ourStory,
    handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
    handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
    handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,
    loadEditData, fetchInvitationConfig,
    dirty, previewMode, markDirty, clearDirty, toggleSection, setupUnsavedGuard,
    saveFullEvent, saving,
  } = useInvitationEditMode();

  const toast = useToast();

  /* ---- Template refs & UI state ---------------------------------- */
  const rootRef = ref(null);
  const entryRef = ref(null);
  const showEntry = ref(false); // TODO: revert to true when done testing
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
  const SIDEBAR_SECTIONS = [
    // Tab 1: Sections
    { key: 'entry',        label: t('editSection.entry'),    tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>' },
    { key: 'hero',         label: t('editSection.hero'),     tab: 'sections', mandatory: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { key: 'details',      label: t('editSection.details'),  tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { key: 'agendaList',   label: t('editSection.agenda'),   tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
    { key: 'ourStoryList', label: t('editSection.ourStory'), tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
    { key: 'ourStoryImages', label: t('editSection.storyImages') || 'Story Images', tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
    { key: 'collage',      label: t('editSection.collage'),  tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { key: 'rsvp',         label: t('editSection.rsvp'),     tab: 'sections', mandatory: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
    // Tab 2: Style
    { key: 'colors',     label: t('editSection.colors'),     tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="14.5" cy="19.5" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="4.5" cy="9.5" r="2.5"/></svg>' },
    { key: 'fonts',      label: t('editSection.fonts'),      tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>' },
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

  /* ---- Hero event data computed ---------------------------------- */
  const heroEventData = computed(() => ({
    heroImageUrl: config.heroPhotoUrl || '',
  }));

  /* ---- File refs ------------------------------------------------- */
  const heroFile = ref(null);
  const ourStoryFiles = ref([]);
  const collageFiles = ref([]);

  /* ---- Backend data ref ------------------------------------------ */
  const backendData = ref(null);

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

  function onOurStoryFiles(files) { ourStoryFiles.value.push(...files); markDirty(); }
  function onCollageFiles(files)  { collageFiles.value.push(...files); markDirty(); }

  function onHeroChange(data) {
    if (data.heroImageUrl) config.heroPhotoUrl = data.heroImageUrl;
    if (data.heroFile !== undefined) heroFile.value = data.heroFile;
    markDirty();
  }

  function onInfoChange(data) {
    if (data.brideName !== undefined) config.brideName = data.brideName;
    if (data.groomName !== undefined) config.groomName = data.groomName;
    if (data.date) {
      config.weddingDateTime = data.date;
      config.weddingDate = formatDate(data.date);
      config.weddingTime = formatTime(data.date);
    }
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
  async function onDetailsDelete(id) {
    await handleEventDetailDelete(id);
  }

  function onAgendaAdd() {
    openModal('agendaItem');
  }
  function onAgendaEdit(item) {
    openModal('agendaItem', item);
  }
  async function onAgendaDelete(id) {
    await handleAgendaDelete(id);
    agenda.loadAgenda();
  }

  function onOurStoryAdd() {
    openModal('ourStoryItem');
  }
  function onOurStoryEdit(item) {
    openModal('ourStoryItem', item);
  }
  async function onOurStoryDelete(id) {
    await handleOurStoryDelete(id);
    ourStory.loadStories();
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

    if (ev.date) {
      config.weddingDateTime = ev.date;
      config.weddingDate = formatDate(ev.date);
      config.weddingTime = formatTime(ev.date);
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

    // Agenda -> schedule timeline
    if (Array.isArray(data.agenda) && data.agenda.length) {
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
    if (Array.isArray(data.ourStory) && data.ourStory.length) {
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
    if (collageImages.length) {
      config.galleryPhotos = collageImages.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }

    // RSVP
    const rsvpDate = ev.rsvpDeadline || (ev.date ? (() => {
      const d = new Date(ev.date);
      d.setDate(d.getDate() - 14);
      return d.toISOString();
    })() : null);
    if (rsvpDate) {
      config.rsvpMessage = t('invitation.rsvpSubtitle', { date: formatDate(rsvpDate) });
    }

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

  async function refreshAllData() {
    const data = await fetchData();
    if (data) {
      backendData.value = data;
      const defaultHero = config.heroPhotoUrl;
      config.heroPhotoUrl = '';
      applyBackendData(data);
      await loadGalleryImages();
      if (!config.heroPhotoUrl) config.heroPhotoUrl = defaultHero;
    }
  }

  refreshCallback.value = refreshAllData;

  /* ================================================================ */
  /*  Draft save / load                                               */
  /* ================================================================ */

  function saveThemeToDraft() {
    if (!isAuthenticated()) {
      setDraftTheme({
        rootBg:        rootBg.value,
        palette:       { ...palette },
        fonts:         { ...fonts },
        buttonStyle:   { ...buttonStyle },
        cardStyle:     { ...cardStyle },
        spacingPreset: spacingPreset.value,
        rsvpConfig:    { ...rsvpConfig },
        heroFamily:    heroFamily.value,
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
    } else if (!isAuthenticated()) {
      // Guest: from localStorage draft
      theme        = getDraftTheme();
      sectionState = getDraftSectionState();
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

  async function onGlobalSave() {
    const payloadArgs = {
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
      eventDetailItems:  eventDetails.items.value,
      agendaItems:       agenda.items.value,
      ourStoryItems:     ourStory.items.value,
      invitationName:    route.params.design || preset.id,
      lang:              locale.value,
      heroFamily:        heroFamily.value,
      scheduleFamily:    scheduleFamily.value,
      storyFamily:       storyFamily.value,
    };

    if (isAuthenticated()) {
      try {
        const payload = buildEventFullPayload(payloadArgs);
        await saveFullEvent(payload, {
          heroImage:      heroFile.value,
          ourStoryImages: ourStoryFiles.value.length ? ourStoryFiles.value : undefined,
          collageImages:  collageFiles.value.length  ? collageFiles.value  : undefined,
        });
        clearDirty();
        await router.push({ name: 'dashboard.overview', params: { lang: locale.value } });
      } catch (e) {
        toast.apiError(e);
      }
      return;
    } else {
      const payload = buildEventFullPayload(payloadArgs);
      saveThemeToDraft();
      setDraftFullPayload(payload);
      clearDirty();
      router.push({ name: 'signup', params: { lang: locale.value } });
      return;
    }
  }

  /* ================================================================ */
  /*  RSVP submit                                                     */
  /* ================================================================ */

  async function onRsvpSubmit(payload) {
    if (!eventId) return;
    try {
      await rsvpService.submitRsvp(eventId, payload);
      const names = payload.guests ? payload.guests.map(g => g.fullName) : [];
      router.push({
        name: 'RsvpSuccessSubmitPage',
        params: { lang: route.params.lang || 'mk' },
        query: { names: JSON.stringify(names) },
      });
    } catch (e) {
      console.error('RSVP submit failed:', e);
    }
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

  watch(() => agenda.items.value, (items) => {
    if (!items.length) return;
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

  // Default placeholder images for stories (saved on init before watchers run)
  const _defaultStoryImages = config.stories.map(s => s.imageUrl);

  watch(() => ourStory.items.value, (items) => {
    if (!items.length) return;
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

  async function resetToPreset(p) {
    // Reset visual state to new preset defaults
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

    // Re-fetch backend data & theme for the new design
    await refreshAllData();
    const invConfig = await fetchInvitationConfig();
    if (invConfig) loadThemeFromDraft(invConfig);
  }

  /* ================================================================ */
  /*  onMounted                                                       */
  /* ================================================================ */

  onMounted(async () => {
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

    if (isEditMode.value) {
      loadEditData();
      setupUnsavedGuard(router);
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
    dirty, previewMode, markDirty, saving,

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
    onOurStoryFiles, onCollageFiles,
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
