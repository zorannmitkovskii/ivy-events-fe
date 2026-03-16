import { ref, reactive, computed } from 'vue';

export function useSectionState(defaultSections) {
  const contentSections = defaultSections.filter(s => s.tab === 'sections');
  const styleSections = defaultSections.filter(s => s.tab === 'style');

  const sectionOrder = ref(contentSections.map(s => s.key));
  const sectionVisibility = ref({});
  const sectionLayouts = reactive({});
  const sectionOverrides = reactive({});

  // Ordered sections: content sections in drag order + style sections at end
  const orderedSections = computed(() => {
    const ordered = sectionOrder.value
      .map(key => defaultSections.find(s => s.key === key))
      .filter(Boolean);
    return [...ordered, ...styleSections];
  });

  function isSectionVisible(key) {
    return sectionVisibility.value[key] !== false;
  }

  function toggleVisibility(key) {
    const current = sectionVisibility.value[key] ?? true;
    sectionVisibility.value = { ...sectionVisibility.value, [key]: !current };
  }

  function reorder(newOrder) {
    sectionOrder.value = newOrder;
  }

  function setLayout(key, layout) {
    sectionLayouts[key] = layout;
  }

  function setOverride(key, overrides) {
    sectionOverrides[key] = overrides;
  }

  function clearOverride(key) {
    delete sectionOverrides[key];
  }

  function getSectionStatus(key, config) {
    const checks = {
      hero: () => !!config.heroPhotoUrl,
      details: () => !!(config.ceremonyVenue || config.receptionVenue),
      agendaList: () => config.scheduleEvents?.length > 0,
      ourStoryList: () => config.stories?.length > 0,
      gallery: () => config.galleryPhotos?.length > 0,
      rsvp: () => true,
      entry: () => true,
    };
    return (checks[key]?.() ?? true) ? 'complete' : 'warning';
  }

  function getState() {
    return {
      order: [...sectionOrder.value],
      visibility: { ...sectionVisibility.value },
      layouts: { ...sectionLayouts },
      overrides: JSON.parse(JSON.stringify(sectionOverrides)),
    };
  }

  function loadState(state) {
    if (!state) return;
    if (state.order) sectionOrder.value = state.order;
    if (state.visibility) sectionVisibility.value = state.visibility;
    if (state.layouts) Object.assign(sectionLayouts, state.layouts);
    if (state.overrides) Object.assign(sectionOverrides, state.overrides);
  }

  return {
    sectionOrder,
    sectionVisibility,
    sectionLayouts,
    sectionOverrides,
    orderedSections,
    isSectionVisible,
    toggleVisibility,
    reorder,
    setLayout,
    setOverride,
    clearOverride,
    getSectionStatus,
    getState,
    loadState,
  };
}
