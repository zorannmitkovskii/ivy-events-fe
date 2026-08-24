import { computed, ref } from 'vue'
import { crmService } from '@/services/crm.service'
import { getErrorMessage } from '@/services/apiError'

function unwrap(response) {
  return response?.data ?? response ?? null
}

/** The controlled set. A stage the server does not know is a column nothing
 *  can ever be dropped into. */
export const LEAD_STAGES = ['INQUIRY', 'CONSULTATION', 'PROPOSAL', 'WON', 'LOST']

/** The board, and the actions on it (IVY-1001). */
export default function useLeadPipeline() {
  const leads = ref([])
  const loading = ref(false)
  const error = ref(null)
  const busyLeadId = ref(null)

  const byStage = computed(() => {
    const columns = {}
    LEAD_STAGES.forEach((stage) => { columns[stage] = [] })
    leads.value.forEach((lead) => {
      if (columns[lead.stage]) columns[lead.stage].push(lead)
    })
    return columns
  })

  /**
   * Leads with a next action that is due or overdue.
   *
   * <p>The single most useful number on the page. A lead with no next action is
   * a lead nobody is working, and it is invisible in a board sorted by stage.
   */
  const overdue = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return leads.value.filter((lead) =>
      lead.stage !== 'WON' && lead.stage !== 'LOST'
      && lead.nextActionAt && lead.nextActionAt <= today)
  })

  const missingNextAction = computed(() => leads.value.filter((lead) =>
    lead.stage !== 'WON' && lead.stage !== 'LOST' && !lead.nextAction))

  async function load() {
    loading.value = true
    try {
      leads.value = unwrap(await crmService.pipeline()) || []
      error.value = null
    } catch (failure) {
      error.value = getErrorMessage(failure)
    } finally {
      loading.value = false
    }
  }

  /**
   * Reloads, then surfaces the refusal.
   *
   * <p>Order matters. Clearing the error in a `finally` after the reload is how
   * a capacity refusal or an expired proposal reached the console and never the
   * screen — the reload succeeded and wiped the only thing the person needed to
   * read.
   */
  async function report(failure) {
    await load()
    error.value = getErrorMessage(failure)
    return null
  }

  async function run(leadId, action) {
    busyLeadId.value = leadId
    try {
      const result = unwrap(await action())
      await load()
      error.value = null
      return result
    } catch (failure) {
      return report(failure)
    } finally {
      busyLeadId.value = null
    }
  }

  async function create(lead) {
    try {
      const created = unwrap(await crmService.createLead(lead))
      await load()
      error.value = null
      return created
    } catch (failure) {
      return report(failure)
    }
  }

  const moveTo = (leadId, stage) => run(leadId, () => crmService.moveTo(leadId, stage))
  const win = (leadId) => run(leadId, () => crmService.win(leadId))
  const lose = (leadId, reason, note) => run(leadId, () => crmService.lose(leadId, reason, note))
  const assign = (leadId, ownerId) => run(leadId, () => crmService.assign(leadId, ownerId))

  return {
    leads,
    byStage,
    overdue,
    missingNextAction,
    loading,
    error,
    busyLeadId,
    load,
    create,
    moveTo,
    win,
    lose,
    assign,
  }
}
