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

  // In dev the plugin ships no worker (`devOptions.enabled: false`), but a
  // worker registered by an earlier *build* on this origin keeps running and
  // keeps serving its precache. That happens every time the containerised
  // frontend is stopped and Vite is started on the same port: the browser goes
  // on answering navigations from the old bundle, so edits appear to do
  // nothing — the change is served, the page never sees it.
  //
  // Unregistering here rather than leaving it to whoever hits it: the symptom
  // is "your fix did not work", which is indistinguishable from a real bug and
  // costs an afternoon to tell apart.
  if (import.meta.env.DEV) {
    return unregisterStaleWorkers()
  }

  return import('virtual:pwa-register')
    .then(({ registerSW }) => {
      // registerSW returns the function that actually applies the waiting
      // worker. Handing it to the caller is the whole point: without it
      // "asks before updating" degrades into "never updates", because a
      // waiting worker only activates once every tab of the origin is closed
      // — a refresh keeps the page controlled and changes nothing.
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh: () => onUpdateAvailable?.(updateSW),
        onOfflineReady: () => onOfflineReady?.(),
      })
      return updateSW
    })
    .catch(() => null)
}

/**
 * Removes a worker left behind by a production build of this origin.
 *
 * <p>The caches go too. Unregistering alone leaves the workbox precache in
 * place, and the next registration would adopt it — the stale bundle would
 * survive the fix meant to remove it.
 *
 * <p>Reloads once, and only when a worker was actually controlling the page:
 * the document already on screen came from the old worker, so leaving it there
 * would mean the tab keeps showing the stale app until somebody thinks to
 * refresh.
 */
export async function unregisterStaleWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    if (!registrations.length) return null

    await Promise.all(registrations.map((registration) => registration.unregister()))

    if (typeof caches !== 'undefined') {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
    }

    if (navigator.serviceWorker.controller && typeof location !== 'undefined') {
      location.reload()
    }
    return null
  } catch {
    // A browser that refuses to enumerate registrations is not a reason to
    // stop the app booting.
    return null
  }
}

/**
 * A dismissible bar offering the new version.
 *
 * <p>Built from plain DOM rather than a component, deliberately: it is offered
 * before the app has mounted and must not depend on the router, the store or
 * i18n being ready — the one moment it matters is the moment least likely to
 * have any of them.
 *
 * <p>Offered, not forced. Reloading under somebody working a door is still not
 * an improvement, so this waits to be clicked and can be dismissed.
 */
export function showUpdatePrompt(applyUpdate, { label, action } = {}) {
  if (typeof document === 'undefined' || document.getElementById('pwa-update')) return

  const bar = document.createElement('div')
  bar.id = 'pwa-update'
  bar.setAttribute('role', 'status')
  bar.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:16px', 'transform:translateX(-50%)',
    'z-index:2147483647', 'display:flex', 'gap:.75rem', 'align-items:center',
    'padding:.6rem .9rem', 'border-radius:10px', 'background:#222', 'color:#fff',
    'font:14px/1.3 system-ui,sans-serif', 'box-shadow:0 6px 24px rgba(0,0,0,.25)',
  ].join(';')

  const text = document.createElement('span')
  text.textContent = label || 'Нова верзија е достапна.'

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = action || 'Освежи'
  button.style.cssText =
    'background:#5a7a52;color:#fff;border:0;border-radius:6px;padding:.35rem .7rem;cursor:pointer'
  button.addEventListener('click', () => {
    bar.remove()
    // true => activate the waiting worker and reload.
    applyUpdate?.(true)
  })

  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.textContent = '✕'
  dismiss.setAttribute('aria-label', 'Затвори')
  dismiss.style.cssText =
    'background:none;color:#bbb;border:0;cursor:pointer;font-size:1rem;line-height:1'
  dismiss.addEventListener('click', () => bar.remove())

  bar.append(text, button, dismiss)
  document.body.appendChild(bar)
}
