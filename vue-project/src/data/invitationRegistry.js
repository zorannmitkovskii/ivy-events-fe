import { EventCategoryEnum } from '@/enums/EventCategory';

export const INVITATION_REGISTRY = {
  [EventCategoryEnum.WEDDING]: [
    { id: 'persianWedding', slug: 'persian-wedding', name: 'Persian Wedding', subtitle: 'Glass & Gradient', thumbnailUrl: '/thumbnails/persian-wedding.svg' },
    { id: 'parisianWedding', slug: 'parisian-wedding', name: 'Parisian Wedding', subtitle: 'Elegant French', thumbnailUrl: '/thumbnails/parisian-wedding.svg' },
    { id: 'coastalBreeze', slug: 'coastal-breeze', name: 'Coastal Breeze', subtitle: 'Modern Seaside', thumbnailUrl: '/thumbnails/coastal-breeze.svg' },
    { id: 'elegantChateau', slug: 'elegant-chateau', name: 'Elegant Chateau', subtitle: 'French Chateau', thumbnailUrl: '/thumbnails/elegant-chateau.svg' },
    { id: 'modernCollage', slug: 'modern-collage', name: 'Modern Collage', subtitle: 'Grid Layout', thumbnailUrl: '/thumbnails/modern-collage.svg' },
    { id: 'sunsetGlass', slug: 'sunset-glass', name: 'Sunset Glass', subtitle: 'Sunset Glass' },
  ],
};
