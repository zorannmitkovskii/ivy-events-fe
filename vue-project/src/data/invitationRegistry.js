import { EventCategoryEnum } from '@/enums/EventCategory';

export const INVITATION_REGISTRY = {
  [EventCategoryEnum.WEDDING]: [
    { id: 'persianWedding', slug: 'persian-wedding', name: 'Persian Wedding', subtitle: 'Glass & Gradient' },
    { id: 'parisianWedding', slug: 'parisian-wedding', name: 'Parisian Wedding', subtitle: 'Elegant French' },
    { id: 'coastalBreeze', slug: 'coastal-breeze', name: 'Coastal Breeze', subtitle: 'Modern Seaside' },
    { id: 'sunsetGlass', slug: 'sunset-glass', name: 'Sunset Glass', subtitle: 'Sunset Glass' },
  ],
};
