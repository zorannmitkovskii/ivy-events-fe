import { createI18n } from "vue-i18n";
import mk from "./locales/mk.json";
import en from "./locales/en.json";
import sq from "./locales/sq.json";

const messages = { mk, en, sq };

function detectLocale() {
  try {
    const saved = localStorage.getItem("lang");
    if (saved && messages[saved]) return saved;
  } catch (_) {}

  const nav =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : "mk";

  const short = nav.split("-")[0];
  return messages[short] ? short : "mk";
}

const i18n = createI18n({
  legacy: false, // ✅ REQUIRED for useI18n()
  locale: detectLocale(),
  fallbackLocale: "en",
  messages
});

export function setLocale(newLocale) {
  if (!messages[newLocale]) {
    console.warn(`[i18n] Unsupported locale: ${newLocale}`);
    return;
  }

  i18n.global.locale.value = newLocale;

  // The document has to say which language it is in (IVY-1204). `index.html`
  // hardcodes `mk`, so before this the English site told every screen reader
  // and every crawler that it was Macedonian — and a reader with a Macedonian
  // voice pronounced English text with it.
  if (typeof document !== "undefined") {
    document.documentElement.lang = newLocale;
  }

  try {
    localStorage.setItem("lang", newLocale);
  } catch (_) {}
}

// Optional helper if you ever want direct usage (not required)
export function t(key, params) {
  return i18n.global.t(key, params);
}

export default i18n;
