import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests for the flows that only a browser can prove.
 *
 * <p>The specs stub the API at the network boundary rather than running against
 * a live backend. What they are checking is frontend behaviour — that switching
 * the current event actually reloads the page under it — and a stubbed backend
 * makes that deterministic and runnable in CI without a database, a Keycloak
 * and seeded fixtures. Full-stack coverage of the same flows belongs with the
 * backend's own integration tests, which already have those things.
 */
const E2E_PORT = process.env.E2E_PORT || '5174'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  /**
   * Its own dev server on its own port.
   *
   * <p>Port 5173 is where the docker-compose frontend serves a built image, so
   * reusing it would run these tests against whatever was last built rather
   * than the working tree — which is exactly the failure mode e2e tests are
   * supposed to catch.
   *
   * <p>The port is overridable because 5174 is not ours alone on a developer's
   * machine — another product's compose file publishes it — and the run should
   * be movable rather than requiring somebody else's container to be stopped.
   */
  webServer: {
    command: `npm run dev -- --port ${E2E_PORT} --strictPort`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
