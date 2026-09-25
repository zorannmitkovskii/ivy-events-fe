import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencySidebarNav from '@/components/layout/AgencySidebarNav.vue'
import { __resetPrivileges } from '@/composables/usePrivileges'
import en from '@/i18n/locales/en.json'

/**
 * The agency console's navigation (IVY-1401), for both people who use it.
 *
 * <p>These screens had no shell, so the dashboard's tile grid was the only way
 * between them — and the redesign removed the tiles on the strength of a claim
 * that a sidebar already held the same links. It did not. This file is where
 * that guarantee now lives, so the tiles can never be removed again without
 * something failing.
 *
 * <p>Since 2026-09 the sidebar is drawn per role: the owner's is the agency's,
 * grouped by job; a member's is their own work plus the vendor directory.
 */

const OWNER_PRIVILEGES = [
  'agency:dashboard', 'agency:events', 'agency:crm', 'agency:calendar', 'agency:tasks',
  'agency:team', 'agency:vendors', 'agency:reports', 'agency:settings',
]

const roles = new Set()
const held = { privileges: [] }

vi.mock('@/services/auth.service', () => ({
  getFullName: () => 'Zoran Mitkovski',
  getUserId: () => 'u-me',
  hasRole: (role) => roles.has(role),
  logout: vi.fn(),
}))

vi.mock('@/services/privileges.service', () => ({
  privilegesService: {
    mine: () => Promise.resolve({ data: { data: [{ type: 'AGENCY', privileges: held.privileges }] } }),
  },
}))

// The overdue badge reads the task board on mount; an unmocked call would
// reach the network from a unit test.
vi.mock('@/services/agencyWorkspace.service', () => ({
  agencyWorkspaceService: {
    tasks: () => Promise.resolve({ data: { tasks: [
      ...Array.from({ length: 8 }, (_, i) => ({ id: `o-${i}`, overdue: true, assignee: null })),
      { id: 'fine', overdue: false, assignee: null },
      { id: 'mine', overdue: true, assignee: { id: 'u-me', name: 'Me' } },
    ] } }),
  },
}))

vi.mock('@/services/crm.service', () => ({
  // Wrapped like every CRM read: the plan is the envelope's data.
  crmService: { plan: () => Promise.resolve({ success: true, data: { tier: 'AGENCY', activeEvents: 3 } }) },
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({ params: { lang: 'en' }, path: currentPath }),
    useRouter: () => ({ push: vi.fn() }),
  }
})

let currentPath = '/en/agency/dashboard'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

async function render() {
  const wrapper = mount(AgencySidebarNav, {
    global: {
      plugins: [i18n],
      stubs: {
        SidebarAccount: true,
        // The shell renders the dark chrome around the rows; what this file
        // guards is the rows, so the shell is a passthrough for its slots.
        DashSide: {
          props: ['contextName', 'plan'],
          template: '<div><p class="ctx">{{ contextName }} / {{ plan }}</p><slot name="context" /><slot name="nav" /><slot name="promo" /><slot name="account" /></div>',
        },
        DashNavItem: {
          props: ['to', 'label', 'icon', 'active', 'count'],
          template: '<a class="nav-item" :href="to" :data-active="active" :data-count="count">{{ label }}</a>',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

const hrefsOf = (wrapper) => wrapper.findAll('.nav-item').map((a) => a.attributes('href'))
const captionsOf = (wrapper) => wrapper.findAll('.snav-caption').map((p) => p.text())

function signInAs(role, privileges) {
  roles.clear()
  roles.add(role)
  held.privileges = privileges
}

beforeEach(() => {
  __resetPrivileges()
  currentPath = '/en/agency/dashboard'
  signInAs('AGENCY', OWNER_PRIVILEGES)
})

describe('what the agency owner can reach', () => {
  it('offers every agency screen, so none is reachable only by typing the URL', async () => {
    const hrefs = hrefsOf(await render())

    for (const path of ['dashboard', 'events', 'calendar', 'tasks', 'pipeline', 'vendors', 'users', 'privileges', 'reports', 'site', 'settings']) {
      expect(hrefs).toContain(`/en/agency/${path}`)
    }
  })

  it('groups the rows under the three captions of the design', async () => {
    expect(captionsOf(await render())).toEqual(['Main', 'Operations', 'Management'])
  })

  it('keeps the events link inside the agency shell rather than on the bare organiser page', async () => {
    // /organizer is the standalone overview. Linking the agency sidebar
    // straight at it dropped the sidebar mid-session and left no way back.
    expect(hrefsOf(await render())).not.toContain('/en/organizer')
  })

  it('lights exactly the screen being looked at', async () => {
    currentPath = '/en/agency/privileges'
    const active = (await render()).findAll('.nav-item').filter((a) => a.attributes('data-active') === 'true')

    expect(active.map((a) => a.text())).toEqual(['Team permissions'])
  })

  it('names the running events and the plan, in the page language, on the context card', async () => {
    expect((await render()).find('.ctx').text()).toBe('3 active events / Agency plan')
  })

  it('counts the overdue work of the agency on the tasks row', async () => {
    const tasks = (await render()).findAll('.nav-item').find((a) => a.text().startsWith('Tasks'))

    expect(tasks.attributes('data-count')).toBe('9')
  })

  it('drops a row the owner has lost the privilege for, and an emptied group with it', async () => {
    signInAs('AGENCY', OWNER_PRIVILEGES.filter((p) => !['agency:team', 'agency:reports', 'agency:settings'].includes(p)))
    const wrapper = await render()

    expect(hrefsOf(wrapper)).not.toContain('/en/agency/reports')
    expect(captionsOf(wrapper)).toEqual(['Main', 'Operations'])
  })

  it('keeps the language of the URL, rather than sending everyone to Macedonian', async () => {
    expect(hrefsOf(await render()).every((href) => href.startsWith('/en/'))).toBe(true)
  })
})

describe('what a member can reach', () => {
  it('draws their own work and the vendor directory — and none of the owner screens', async () => {
    signInAs('AGENCY_MEMBER', [])
    const wrapper = await render()

    expect(captionsOf(wrapper)).toEqual(['My work', 'Resources'])
    expect(wrapper.findAll('.nav-item').map((a) => a.text())).toEqual([
      'My overview', 'My events', 'My calendar', 'My tasks', 'Vendors · directory',
    ])
    for (const ownerOnly of ['users', 'privileges', 'reports', 'site', 'settings', 'pipeline']) {
      expect(hrefsOf(wrapper)).not.toContain(`/en/agency/${ownerOnly}`)
    }
  })

  it('adds an owner screen the member was granted, when a member can open it', async () => {
    signInAs('AGENCY_MEMBER', ['agency:crm', 'agency:reports'])
    const hrefs = hrefsOf(await render())

    expect(hrefs).toContain('/en/agency/pipeline')
    // Reports is the owner's on the server whatever a privilege row says;
    // offering it would be a link that opens onto a refusal.
    expect(hrefs).not.toContain('/en/agency/reports')
  })

  it('does not hide a member their own work when their privileges cannot be read', async () => {
    signInAs('AGENCY_MEMBER', [])
    expect(hrefsOf(await render())).toContain('/en/agency/tasks')
  })
})

describe('the tasks badge for a member', () => {
  it('counts only the overdue tasks assigned to them, as their task screen opens', async () => {
    signInAs('AGENCY_MEMBER', [])
    const tasks = (await render()).findAll('.nav-item').find((a) => a.text().startsWith('My tasks'))

    expect(tasks.attributes('data-count')).toBe('1')
  })
})
