import { watch, onBeforeUnmount, isRef } from 'vue';

/**
 * Injects one or more JSON-LD schema objects into &lt;head&gt; as
 * &lt;script type="application/ld+json"&gt; elements. Automatically removes
 * them when the owning component unmounts.
 *
 * Reactive: pass a Ref or a getter returning schema(s) and the DOM tag will
 * update whenever the source changes. Null / undefined entries are dropped
 * (safe with the builders in {@link ./utils/jsonLdSchemas.js} which return
 * null for invalid input).
 *
 * @param {object|object[]|import('vue').Ref|(() => object|object[])} source
 * @param {{ id?: string }} [options] id groups related scripts so a component
 *   that re-renders only replaces its own tags, not other components'.
 */
export function useJsonLd(source, { id = crypto?.randomUUID?.() ?? String(Date.now()) } = {}) {
  if (typeof document === 'undefined') return;

  const attrName = 'data-jsonld-id';

  function normalize(value) {
    const arr = Array.isArray(value) ? value : [value];
    return arr.filter(x => x && typeof x === 'object');
  }

  function readSource() {
    if (isRef(source)) return source.value;
    if (typeof source === 'function') return source();
    return source;
  }

  function clear() {
    document.querySelectorAll(`script[${attrName}="${id}"]`).forEach(el => el.remove());
  }

  function apply() {
    clear();
    const schemas = normalize(readSource());
    for (const schema of schemas) {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute(attrName, id);
      el.textContent = JSON.stringify(schema);
      document.head.appendChild(el);
    }
  }

  if (isRef(source) || typeof source === 'function') {
    watch(readSource, apply, { immediate: true, deep: true });
  } else {
    apply();
  }

  onBeforeUnmount(clear);
}
