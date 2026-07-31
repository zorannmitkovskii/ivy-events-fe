import { readonly, ref } from "vue";
import { vendorPortalService } from "@/services/vendorPortal.service";

/**
 * Who the signed-in vendor is and which sections their trade needs.
 *
 * <p>Held at module level and fetched once: the layout draws navigation from
 * it and the route guard turns away a photographer typing /vendor/floor-plans
 * by hand, and two fetches would let those two disagree for a moment.
 *
 * <p>The capability list comes from the backend rather than a copy of the type
 * map kept here, so a new vendor type does not need a frontend release.
 */
const profile = ref(null);
const notLinked = ref(false);
let inFlight = null;

async function load() {
  if (profile.value) return profile.value;
  if (inFlight) return inFlight;

  inFlight = vendorPortalService
    .me()
    .then(({ data }) => {
      profile.value = data;
      notLinked.value = false;
      return data;
    })
    .catch((error) => {
      // A VENDOR role with no vendor row behind it is a setup problem, not a
      // crash: the screens stay reachable and say what is missing.
      const status = error?.response?.status;
      if (status === 400 || status === 403 || status === 404) {
        notLinked.value = true;
        return null;
      }
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

function can(capability) {
  return Boolean(profile.value?.capabilities?.includes(capability));
}

/** Called on sign-out: the next vendor to sign in must not inherit this one. */
function reset() {
  profile.value = null;
  notLinked.value = false;
  inFlight = null;
}

export function useVendorProfile() {
  return { profile: readonly(profile), notLinked: readonly(notLinked), load, can, reset };
}
