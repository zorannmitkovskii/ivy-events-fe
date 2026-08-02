/**
 * A signed-in browser, without a Keycloak.
 *
 * <p>The frontend never verifies the token — it base64-decodes the payload to
 * read roles and the subject, and the backend is what validates signatures. So
 * an unsigned token with the right claims is enough to put the app in the state
 * these tests are about, and it keeps the specs free of a live identity server.
 */

function base64Url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function fakeToken({ sub, roles = ['ORGANIZER'], packages = [] }) {
  const header = base64Url({ alg: 'none', typ: 'JWT' })
  const payload = base64Url({
    sub,
    preferred_username: 'e2e@example.com',
    given_name: 'E2E',
    family_name: 'Tester',
    realm_access: { roles },
    packages,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
  return `${header}.${payload}.signature-not-checked-by-the-frontend`
}

/**
 * Seeds storage before any app code runs.
 *
 * <p>{@code addInitScript} rather than navigating and then setting storage: the
 * router guard reads the token during the very first navigation, so a token
 * written afterwards is one redirect too late.
 */
export async function signIn(page, { userId, eventId, lang = 'mk' }) {
  await page.addInitScript(
    ({ token, eventId, lang }) => {
      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', 'refresh-not-used')
      localStorage.setItem('lang', lang)
      localStorage.setItem(
        'onboarding_state_v1',
        JSON.stringify({
          email: 'e2e@example.com',
          isEmailVerified: true,
          selectedCategory: 'WEDDING',
          eventId,
          invitationName: '',
          eventDetails: {},
          selectedPackageType: '',
        }),
      )
    },
    { token: fakeToken({ sub: userId }), eventId, lang },
  )
}
