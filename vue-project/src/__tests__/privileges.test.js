import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/privileges.service', () => ({
  privilegesService: { mine: vi.fn() },
}))

import { privilegesService } from '@/services/privileges.service'
import { usePrivileges, __resetPrivileges } from '@/composables/usePrivileges'

/**
 * The sidebar is drawn from what a person may open, not from their role.
 *
 * <p>These pin the two things that make that safe: it fails open when the call
 * fails, and it asks once however many sidebars mount together.
 */
describe('usePrivileges', () => {
  beforeEach(() => {
    __resetPrivileges()
    privilegesService.mine.mockReset()
  })

  afterEach(() => __resetPrivileges())

  const answer = (workspaces) => ({ data: { data: workspaces } })

  it('shows only what the person holds', async () => {
    privilegesService.mine.mockResolvedValue(answer([
      { type: 'VENDOR', workspaceId: 'v-1', owner: false, privileges: ['vendor:inquiries'] },
    ]))

    const { load, can } = usePrivileges()
    await load()

    expect(can('vendor:inquiries')).toBe(true)
    expect(can('vendor:quotes')).toBe(false)
  })

  it('fails open when the call fails, rather than blanking the sidebar', async () => {
    privilegesService.mine.mockRejectedValue(new Error('network'))

    const { load, can, failed } = usePrivileges()
    await load()

    // A blank sidebar is indistinguishable from a permissions change, and the
    // backend refuses what it refuses either way.
    expect(failed.value).toBe(true)
    expect(can('vendor:quotes')).toBe(true)
  })

  it('shows everything before the answer arrives', () => {
    const { can } = usePrivileges()

    // Otherwise every sidebar flashes empty on first paint.
    expect(can('agency:reports')).toBe(true)
  })

  it('asks once however many sidebars mount together', async () => {
    privilegesService.mine.mockResolvedValue(answer([]))

    const { load } = usePrivileges()
    await Promise.all([load(), load(), load()])

    expect(privilegesService.mine).toHaveBeenCalledTimes(1)
  })

  it('knows which workspaces the person owns', async () => {
    privilegesService.mine.mockResolvedValue(answer([
      { type: 'AGENCY', workspaceId: 'a-1', owner: true, privileges: ['agency:team'] },
      { type: 'VENDOR', workspaceId: 'v-1', owner: false, privileges: ['vendor:calendar'] },
    ]))

    const { load, ownerOf, workspaceIdOf } = usePrivileges()
    await load()

    expect(ownerOf('AGENCY')).toBe(true)
    expect(ownerOf('VENDOR')).toBe(false)
    expect(workspaceIdOf('AGENCY')).toBe('a-1')
  })

  it('keeps nav order and drops only what is refused', async () => {
    privilegesService.mine.mockResolvedValue(answer([
      { type: 'AGENCY', workspaceId: 'a-1', owner: false,
        privileges: ['agency:dashboard', 'agency:tasks'] },
    ]))

    const { load, filterNav } = usePrivileges()
    await load()

    const nav = [
      { key: 'dashboard', privilege: 'agency:dashboard' },
      { key: 'reports', privilege: 'agency:reports' },
      { key: 'tasks', privilege: 'agency:tasks' },
      { key: 'always', privilege: null },
    ]

    expect(filterNav(nav).map((i) => i.key)).toEqual(['dashboard', 'tasks', 'always'])
  })

  it('an owner is given everything the backend listed for them', async () => {
    privilegesService.mine.mockResolvedValue(answer([
      { type: 'VENDOR', workspaceId: 'v-1', owner: true,
        privileges: ['vendor:calendar', 'vendor:billing', 'vendor:team'] },
    ]))

    const { load, can } = usePrivileges()
    await load()

    // Billing is owner-only and never granted; an owner still holds it.
    expect(can('vendor:billing')).toBe(true)
  })
})
