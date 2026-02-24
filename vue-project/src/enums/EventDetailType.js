export const EventDetailType = Object.freeze({
  REGISTRATION: 'REGISTRATION',
  RECEPTION:    'RECEPTION',
  CHURCH:       'CHURCH',
  LOCATION:     'LOCATION',
  COUNTDOWN:    'COUNTDOWN',
});

// Fixed icon per type (emoji)
export const EventDetailTypeIcon = Object.freeze({
  REGISTRATION: '\u{1F4DD}',
  RECEPTION:    '\u{1F389}',
  CHURCH:       '\u26EA',
  LOCATION:     '\u{1F4CD}',
  COUNTDOWN:    '\u231B',
});

// Fixed display order per type
export const EventDetailTypeSortOrder = Object.freeze({
  REGISTRATION: 1,
  RECEPTION:    2,
  CHURCH:       3,
  LOCATION:     4,
  COUNTDOWN:    5,
});
