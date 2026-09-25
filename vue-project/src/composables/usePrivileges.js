import { computed, ref } from 'vue'
import { privilegesService } from '@/services/privileges.service'

/**
 * What this person may open, loaded once and shared.
 *
 * <p>Module-level state rather than per-component: every sidebar asks the same
 * question, and four components each fetching the answer on mount is four
 * requests for one fact — and four chances for them to disagree mid-render.
 *
 * <p><b>Fails open on purpose.</b> If the call errors the sidebars fall back to
 * showing everything the role already allowed, because the alternative is a
 * person with a blank sidebar and no way to tell a permissions change from a
 * network blip. The backend refuses what it refuses either way; this only
 * decides what is worth drawing.
 */

const workspaces = ref([])
const loaded = ref(false)
const failed = ref(false)
let inFlight = null

/** Wire names of everything held, across every workspace. */
const held = computed(() => new Set(workspaces.value.flatMap((w) => w.privileges || [])))

export function usePrivileges() {
  /**
   * Loads once per session.
   *
   * <p>Concurrent callers share the same promise rather than each starting a
   * request — four sidebars mounting together is the normal case, not the
   * exception.
   */
  async function load({ force = false } = {}) {
    if (loaded.value && !force) return workspaces.value
    if (inFlight && !force) return inFlight

    inFlight = privilegesService
      .mine()
      .then((response) => {
        workspaces.value = response?.data?.data ?? response?.data ?? []
        failed.value = false
        return workspaces.value
      })
      .catch(() => {
        // Fail open. See the note at the top of this file.
        workspaces.value = []
        failed.value = true
        return []
      })
      .finally(() => {
        loaded.value = true
        inFlight = null
      })

    return inFlight
  }

  /**
   * Whether one screen may be opened.
   *
   * @param wireName for example `agency:reports`
   */
  function can(wireName) {
    if (!loaded.value || failed.value) return true
    return held.value.has(wireName)
  }

  /** Whether the caller owns this workspace, which is what unlocks managing it. */
  function ownerOf(workspaceType) {
    return workspaces.value.some((w) => w.type === workspaceType && w.owner)
  }

  function workspaceIdOf(workspaceType) {
    return workspaces.value.find((w) => w.type === workspaceType)?.workspaceId ?? null
  }

  /** Keeps a nav list in the order it was written, dropping what is refused. */
  function filterNav(items, privilegeOf = (item) => item.privilege) {
    return items.filter((item) => {
      const wireName = privilegeOf(item)
      return !wireName || can(wireName)
    })
  }

  return {
    workspaces,
    loaded,
    failed,
    load,
    can,
    ownerOf,
    workspaceIdOf,
    filterNav,
  }
}

/** Test seam: drops the shared state so one test cannot colour the next. */
export function __resetPrivileges() {
  workspaces.value = []
  loaded.value = false
  failed.value = false
  inFlight = null
}
