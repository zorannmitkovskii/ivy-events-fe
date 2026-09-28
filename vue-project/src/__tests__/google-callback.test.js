import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * Coming back from Google to /auth/verify-email.
 *
 * <p>That address is also the email-code form after a signup. It used to tell
 * the two apart by `code` and `session_state` together, and to ignore an
 * `error` entirely — so a refused sign-in, or a callback without
 * session_state, showed "we sent a code to ." with no address in it.
 */

const auth = vi.hoisted(() => ({
  exchangeOAuthCode: vi.fn(),
  assignRole: vi.fn(),
  refreshAccessToken: vi.fn(),
  verifyEmail: vi.fn(),
  loginWithCredentials: vi.fn(),
  isAuthenticated: vi.fn(() => false),
}))
const route = vi.hoisted(() => ({ params: { lang: 'en' }, query: {} }))
const replace = vi.hoisted(() => vi.fn())

vi.mock('@/services/auth.service', () => auth)
vi.mock('@/router/landing', () => ({ landingAfterAuth: vi.fn(async () => ({ name: 'dashboard.overview' })) }))
vi.mock('@/composables/useDraftSync', () => ({ syncDraftToBackend: vi.fn(async () => null) }))
vi.mock('@/services/jwt', () => ({ decodeJwtPayload: () => ({ email: 'ana@example.com', realm_access: { roles: ['USER'] } }) }))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ replace, push: vi.fn() }),
}))

const AuthVerifyEmailPage = (await import('@/pages/auth/AuthVerifyEmailPage.vue')).default
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render(query) {
  route.query = query
  return mount(AuthVerifyEmailPage, { global: { plugins: [i18n], stubs: { AuthShell: { template: '<div><slot /></div>' } } } })
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  auth.exchangeOAuthCode.mockResolvedValue({})
})

describe('a refused Google sign-in', () => {
  it('says it failed, with Keycloak\'s reason, instead of an empty code form', async () => {
    const wrapper = render({ error: 'invalid_request', error_description: 'Missing parameter: code_challenge_method' })
    await flushPromises()

    expect(wrapper.text()).toContain(en.auth.google.failedTitle)
    expect(wrapper.find('[data-testid="oauth-error"]').text()).toBe('Missing parameter: code_challenge_method')
    expect(wrapper.text()).not.toContain(en.auth.verify.cta)
    expect(auth.exchangeOAuthCode).not.toHaveBeenCalled()
  })

  it('goes back to the page the sign-in started from', async () => {
    sessionStorage.setItem('google_oauth_intent', 'signup')
    const wrapper = render({ error: 'access_denied' })
    await flushPromises()

    await wrapper.find('button').trigger('click')

    expect(replace).toHaveBeenCalledWith({ name: 'signup', params: { lang: 'en' } })
  })
})

describe('a successful Google sign-in', () => {
  it('is recognised by its code alone, without session_state', async () => {
    sessionStorage.setItem('google_oauth_intent', 'login')
    const wrapper = render({ code: 'abc', iss: 'https://auth.test' })
    await flushPromises()

    expect(auth.exchangeOAuthCode).toHaveBeenCalledWith('abc', 'http://localhost:3000/en/auth/verify-email')
    expect(wrapper.text()).not.toContain(en.auth.verify.cta)
    expect(replace).toHaveBeenCalledWith({ name: 'dashboard.overview' })
  })
})
