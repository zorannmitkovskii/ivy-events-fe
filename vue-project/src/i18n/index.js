import { ref } from 'vue'
// import mk from './locales/mk.json'
import mk from './locales/mk.json'

const messages = {  mk }

function get(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

function detectLocale() {
  try {
    const saved = localStorage.getItem('lang')
    if (saved && messages[saved]) return saved
  } catch (_) {}
  const nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'mk'
  const short = nav.split('-')[0]
  return messages[short] ? short : 'mk'
}

const locale = ref(detectLocale())

function setLocale(newLocale) {
  if (messages[newLocale]) {
    locale.value = newLocale
    try { localStorage.setItem('lang', newLocale) } catch (_) {}
  } else {
    console.warn(`[i18n] Unsupported locale: ${newLocale}`)
  }
}

function t(key) {
  const loc = locale.value || 'mk'
  return get(messages[loc], key) ?? get(messages['mk'], key) ?? key
}

export default {
  install(app) {
    app.config.globalProperties.$t = t
    app.provide('i18n', { t, setLocale, locale })
  }
}

export { t, setLocale, locale }
