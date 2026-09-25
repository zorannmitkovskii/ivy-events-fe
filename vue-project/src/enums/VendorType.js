/*
  The trades a vendor can be listed under are `VendorType` on the backend and
  come from `GET /public/vendor-types` through `useVendorTypes()` — one list,
  in the backend's grouped order. The copies that used to live here and on
  three screens drifted apart, and a trade missing from the copy you were
  looking at could not be filtered for.
*/

/**
 * The enum name as something a person can read, for when a translation is
 * missing — `GROOM_ATTIRE` becomes `groom attire` rather than being printed
 * in shouting snake case.
 */
export function readableVendorType(type) {
  return (type || '').toLowerCase().replace(/_/g, ' ')
}
