/**
 * Registers the service worker (IVY-602).
 *
 * <p>Asks before updating rather than swapping the running app for a new build
 * on its own. Staff working a door do not want the page to reload while
 * somebody is standing in front of them, and "there is a new version" can wait
 * until the queue is empty.
 *
 * <p>Wrapped in a dynamic import because the virtual module only exists when
 * the PWA plugin runs — a unit test importing the app must not fail on it.
 */
export function registerServiceWorker({ onUpdateAvailable, onOfflineReady } = {}) {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)

  return import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({
      immediate: true,
      onNeedRefresh: () => onUpdateAvailable?.(),
      onOfflineReady: () => onOfflineReady?.(),
    }))
    .catch(() => null)
}
