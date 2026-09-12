/**
 * The trades a vendor can be listed under — `VendorType` on the backend.
 *
 * <p>One list. Three screens had their own partial copy of it before this file
 * existed (the public directory's sixteen, the application form's sixteen, the
 * agency console's six), so a vendor whose trade was missing from the copy you
 * were looking at simply could not be filtered for. The agency console showed
 * "GROOM_ATTIRE" as a raw enum name for exactly that reason.
 *
 * <p>Order is the backend's, which groups them: wedding services, decoration,
 * catering, music, planning, venues, then general. Filter rows read in that
 * order rather than alphabetically, which would interleave the groups.
 */
export const VENDOR_TYPES = Object.freeze([
  'PHOTOGRAPHY',
  'BRIDAL_ATTIRE',
  'GROOM_ATTIRE',
  'MAKEUP_HAIR',

  'DECORATION',
  'FLOWERS',
  'LIGHTING',
  'CAKE',

  'CATERING',
  'BAR_SERVICE',
  'FOOD',

  'DJ',
  'BAND',
  'ENTERTAINMENT',
  'HOST_EMCEE',

  'TRAINING_FACILITATOR',
  'OUTDOOR_ACTIVITY',
  'TRANSPORTATION',
  'EQUIPMENT_RENTAL',

  'VENUE',
  'DECOR_RENTAL',

  'PRINTING',
  'SECURITY',
  'CLEANING',
  'OTHER',
])

/**
 * The enum name as something a person can read, for when a translation is
 * missing — `GROOM_ATTIRE` becomes `groom attire` rather than being printed
 * in shouting snake case.
 */
export function readableVendorType(type) {
  return (type || '').toLowerCase().replace(/_/g, ' ')
}
