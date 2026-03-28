/**
 * Hero component registry.
 * Maps template family names to their hero components (lazy-loaded).
 */
import { defineAsyncComponent } from 'vue';

export const HERO_COMPONENTS = {
  coastal: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/HeroSection.vue')
  ),
  parisian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/ParisianWedding/HeroSection.vue')
  ),
  persian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/PersianWedding/HeroSection.vue')
  ),
  // chateau and collage fall back to existing components
  chateau: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/HeroSection.vue')
  ),
  collage: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/HeroSection.vue')
  ),
};

/**
 * Schedule/timeline component registry per family.
 */
export const SCHEDULE_COMPONENTS = {
  coastal: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/ScheduleList.vue')
  ),
  parisian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/ParisianWedding/AgendaTimeline.vue')
  ),
  persian: defineAsyncComponent(() =>
    import('@/components/invitations/shared/VerticalTimeline.vue')
  ),
  chateau: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/ScheduleList.vue')
  ),
  collage: defineAsyncComponent(() =>
    import('@/components/invitations/shared/EventTimeline.vue')
  ),
};

/**
 * Details/wedding info component registry per family.
 */
export const DETAILS_COMPONENTS = {
  coastal: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/sections/DetailsCards.vue')
  ),
  parisian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/sections/DetailsParisian.vue')
  ),
  persian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/sections/DetailsPersian.vue')
  ),
  chateau: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/sections/DetailsChateau.vue')
  ),
  collage: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/sections/DetailsCollage.vue')
  ),
};

/**
 * Story component registry per family.
 */
export const STORY_COMPONENTS = {
  coastal: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/StoryGallery.vue')
  ),
  parisian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/ParisianWedding/OurStorySection.vue')
  ),
  persian: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/PersianWedding/OurStorySection.vue')
  ),
  chateau: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/StoryGallery.vue')
  ),
  collage: defineAsyncComponent(() =>
    import('@/components/invitations/wedding/CoastalBreeze/StoryGallery.vue')
  ),
};
