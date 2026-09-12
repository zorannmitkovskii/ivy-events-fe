/**
 * Category Mapping Helper
 * Maps between EventCategories component IDs and backend EventCategoryEnum values
 */

import { EventCategoryEnum } from '@/enums/EventCategory.js';

/**
 * Map from EventCategories component ID to backend enum
 */
export const CATEGORY_ID_TO_ENUM = {
  'weddings': EventCategoryEnum.WEDDING,
  'birthdays': EventCategoryEnum.BIRTHDAY,
  'corporate': EventCategoryEnum.CORPORATE,
  'conferences': EventCategoryEnum.CONFERENCE,
  'dinners': EventCategoryEnum.DINNER,
  'baby': EventCategoryEnum.BABY_SHOWER,
  'graduations': EventCategoryEnum.GRADUATION,
  'anniversaries': EventCategoryEnum.ANNIVERSARY,
  'gallery': EventCategoryEnum.GALLERY
};

/**
 * Map from backend enum to EventCategories component ID
 */
export const ENUM_TO_CATEGORY_ID = {
  [EventCategoryEnum.WEDDING]: 'weddings',
  [EventCategoryEnum.BIRTHDAY]: 'birthdays',
  [EventCategoryEnum.CORPORATE]: 'corporate',
  [EventCategoryEnum.CONFERENCE]: 'conferences',
  [EventCategoryEnum.DINNER]: 'dinners',
  [EventCategoryEnum.BABY_SHOWER]: 'baby',
  [EventCategoryEnum.GRADUATION]: 'graduations',
  [EventCategoryEnum.ANNIVERSARY]: 'anniversaries',
  [EventCategoryEnum.GALLERY]: 'gallery'
};

/**
 * Convert category ID to enum
 * @param {string} id - Category ID from EventCategories component
 * @returns {string|null} - Backend EventCategoryEnum value
 */
export function categoryIdToEnum(id) {
  return CATEGORY_ID_TO_ENUM[id] || null;
}

/**
 * Convert enum to category ID
 * @param {string} enumValue - Backend EventCategoryEnum value
 * @returns {string|null} - Category ID for EventCategories component
 */
export function enumToCategoryId(enumValue) {
  return ENUM_TO_CATEGORY_ID[enumValue] || null;
}

/**
 * Map from backend enum to the i18n key under `eventCategories.items`.
 *
 * <p>Not the same as {@link ENUM_TO_CATEGORY_ID}, and the difference is easy
 * to miss: the component IDs are `birthdays`, `dinners`, `baby`, while the
 * translation keys are `birthdaysParties`, `privateDinners`, `babyShowers`.
 * Passing one where the other belongs prints the key on the page.
 */
export const ENUM_TO_LABEL_KEY = {
  [EventCategoryEnum.WEDDING]: 'weddings',
  [EventCategoryEnum.BIRTHDAY]: 'birthdaysParties',
  [EventCategoryEnum.CORPORATE]: 'corporate',
  [EventCategoryEnum.CONFERENCE]: 'conferences',
  [EventCategoryEnum.DINNER]: 'privateDinners',
  [EventCategoryEnum.BABY_SHOWER]: 'babyShowers',
  [EventCategoryEnum.GRADUATION]: 'graduations',
  [EventCategoryEnum.ANNIVERSARY]: 'anniversaries',
  [EventCategoryEnum.GALLERY]: 'gallery',
};

/**
 * The full translation key for a category's name, or null for a value the
 * catalogue has never heard of — the caller shows the raw value rather than a
 * key, which is the honest fallback for an enum the front end is behind on.
 */
export function categoryLabelKey(enumValue) {
  const key = ENUM_TO_LABEL_KEY[enumValue];
  return key ? `eventCategories.items.${key}.title` : null;
}
