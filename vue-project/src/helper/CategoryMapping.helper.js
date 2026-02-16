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
  'anniversaries': EventCategoryEnum.ANNIVERSARY
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
  [EventCategoryEnum.ANNIVERSARY]: 'anniversaries'
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
