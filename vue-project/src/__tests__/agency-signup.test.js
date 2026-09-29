import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * Signing up as an agency, and where the new account lands.
 *
 * <p>The form used to send accountType AGENCY_MEMBER — an Ivy staff role, not
 * an account type — which zm-iam-service refused, so no agency could sign up.
 * And a verified account always went to the couple's first step, agencies
 * included.
 */

const auth = vi.hoisted(() => ({
  register: vi.fn(),
  verifyEmail: vi.fn(),
  exchangeOAuthCode: vi.fn(),
  assignRole: vi.fn(),
  refreshAccessToken: vi.fn(),
  loginWithCredentials: vi.fn(),
  isAuthenticated: vi.fn(() => true),
  hasRole: vi.fn(() => false),
}))
const landing = vi.hoisted(() => ({ landingAfterAuth: vi.fn() }))
const route = vi.hoisted(() => ({ params: { lang: 'mk' }, query: {} }))
const push = vi.hoisted(() => vi.fn())

vi.mock('@/services/auth.service', () => auth)
vi.mock('@/router/landing', () => landing)
vi.mock('@/composables/useDraftSync', () => ({ syncDraftToBackend: vi.fn(async () => null) }))
vi.mock('@/services/googleOAuth', () => ({
  resumePendingGoogleSignIn: vi.fn(),
  startGoogleSignIn: vi.fn(),
  takeGoogleIntent: vi.fn(),
}))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, replace: push }),
}))

const onboarding = await import('@/store/onboarding.store')
const AuthSignupPage = (await import('@/pages/auth/AuthSignupPage.vue')).default
const AuthVerifyEmailPage = (await import('@/pages/auth/AuthVerifyEmailPage.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en }, missingWarn: false, fallbackWarn: false })
const stubs = { AuthShell: { template: '<div><slot /></div>' }, RouterLink: { template: '<a><slot /></a>' } }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  route.params.lang = 'mk'
})

async function fill(wrapper, { accountType, organizationName }) {
  await wrapper.find(`input[type="radio"][value="${accountType}"]`).setValue(true)
  const inputs = () => wrapper.findAll('input:not([type="radio"]):not([type="checkbox"])')
  if (organizationName !== undefined) await inputs()[0].setValue(organizationName)
  const offset = organizationName !== undefined ? 1 : 0
  await inputs()[offset].setValue('Ана')
  await inputs()[offset + 1].setValue('Ристеска')
  await inputs()[offset + 2].setValue('ana@agencija.mk')
  await inputs()[offset + 3].setValue('Lozinka1!')
  await inputs()[offset + 4].setValue('Lozinka1!')
  await wrapper.find('input[type="checkbox"]').setValue(true)
}

describe('the account type on the signup form', () => {
  it('names the agency option in Macedonian instead of showing a raw key', () => {
    const wrapper = mount(AuthSignupPage, { global: { plugins: [i18n], stubs } })

    const labels = wrapper.findAll('.segment-title').map((label) => label.text())
    expect(labels).toEqual(['Личен', 'Агенција'])
  })

  it('signs an agency up as ORGANIZER, the type zm-iam-service accepts, with its name', async () => {
    auth.register.mockResolvedValue({ username: 'ana' })
    const wrapper = mount(AuthSignupPage, { global: { plugins: [i18n], stubs } })

    await fill(wrapper, { accountType: 'ORGANIZER', organizationName: 'Ивена Агенција' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(auth.register).toHaveBeenCalledOnce()
    const payload = auth.register.mock.calls[0][0]
    expect(payload.accountType).toBe('ORGANIZER')
    expect(payload.organizationName).toBe('Ивена Агенција')
  })

  it('sends no organization name for a personal account', async () => {
    auth.register.mockResolvedValue({ username: 'ana' })
    const wrapper = mount(AuthSignupPage, { global: { plugins: [i18n], stubs } })

    await fill(wrapper, { accountType: 'PERSONAL' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(auth.register.mock.calls[0][0]).toMatchObject({ accountType: 'PERSONAL', organizationName: null })
  })
})

describe('landing after the email is verified', () => {
  it('goes where the role belongs — an agency to its workspace', async () => {
    onboarding.setEmail('ana@agencija.mk')
    onboarding.setTempPassword('Lozinka1!')
    landing.landingAfterAuth.mockResolvedValue('/mk/agency/dashboard')
    const wrapper = mount(AuthVerifyEmailPage, { global: { plugins: [i18n], stubs } })

    await wrapper.find('input').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(landing.landingAfterAuth).toHaveBeenCalledWith('mk')
    expect(push).toHaveBeenLastCalledWith('/mk/agency/dashboard')
  })
})
