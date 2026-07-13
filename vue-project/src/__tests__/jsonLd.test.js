/**
 * JSON-LD tests.
 *
 * Two layers:
 *   1) Pure builder tests — enforce schema.org required fields, ensure
 *      the "public gate" on eventSchema cannot be bypassed.
 *   2) DOM emission tests — mount a component that uses <JsonLd />, then
 *      parse the injected <script type="application/ld+json"> element and
 *      verify its content.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent, ref, nextTick, h } from 'vue';
import { mount } from '@vue/test-utils';

import {
  organizationSchema,
  webSiteSchema,
  serviceSchema,
  categoryServiceSchema,
  eventSchema,
  localBusinessSchema,
  DEFAULT_BASE_URL,
} from '@/utils/jsonLdSchemas';
import JsonLd from '@/components/seo/JsonLd.vue';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function readAllJsonLd() {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(el => ({
      node: el,
      json: JSON.parse(el.textContent),
    }));
}

beforeEach(() => {
  document.head.innerHTML = '';
});

/* ------------------------------------------------------------------ */
/*  1) Builder tests                                                  */
/* ------------------------------------------------------------------ */

describe('organizationSchema', () => {
  it('returns valid Organization with defaults', () => {
    const s = organizationSchema({ logo: 'https://ivyevents.mk/logo.svg' });
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toBe('Organization');
    expect(s.name).toBe('Ivy Events');
    expect(s.url).toBe(DEFAULT_BASE_URL);
    expect(s.logo).toBe('https://ivyevents.mk/logo.svg');
  });

  it('drops non-string sameAs entries', () => {
    const s = organizationSchema({ sameAs: ['https://x.com/y', '', null, 42, 'https://fb.com/y'] });
    expect(s.sameAs).toEqual(['https://x.com/y', 'https://fb.com/y']);
  });

  it('returns null when name is blank', () => {
    expect(organizationSchema({ name: '' })).toBeNull();
    expect(organizationSchema({ name: '   ' })).toBeNull();
  });
});

describe('webSiteSchema', () => {
  it('emits WebSite without SearchAction when template lacks placeholder', () => {
    const s = webSiteSchema({});
    expect(s['@type']).toBe('WebSite');
    expect(s.potentialAction).toBeUndefined();
  });

  it('emits WebSite with SearchAction when template has {search_term_string}', () => {
    const s = webSiteSchema({
      searchUrlTemplate: 'https://ivyevents.mk/mk/event-invitations?q={search_term_string}',
    });
    expect(s.potentialAction['@type']).toBe('SearchAction');
    expect(s.potentialAction.target.urlTemplate)
      .toBe('https://ivyevents.mk/mk/event-invitations?q={search_term_string}');
    expect(s.potentialAction['query-input']).toBe('required name=search_term_string');
  });

  it('ignores malformed SearchAction templates', () => {
    const s = webSiteSchema({ searchUrlTemplate: 'https://ivyevents.mk/no-placeholder' });
    expect(s.potentialAction).toBeUndefined();
  });
});

describe('serviceSchema / categoryServiceSchema', () => {
  it('defaults provider to Ivy Events Organization', () => {
    const s = serviceSchema({ name: 'X' });
    expect(s.provider.name).toBe('Ivy Events');
    expect(s.provider['@type']).toBe('Organization');
  });

  it('requires name', () => {
    expect(serviceSchema({})).toBeNull();
  });

  it('categoryServiceSchema returns the right preset for each of the 6 slugs', () => {
    for (const key of ['weddings', 'kids-birthdays', 'adult-birthdays', 'business', 'baby', 'holiday']) {
      const s = categoryServiceSchema(key, { lang: 'en' });
      expect(s).not.toBeNull();
      expect(s['@type']).toBe('Service');
      expect(s.name).toMatch(/Invitations|Planning/);
      expect(s.url).toBe(`${DEFAULT_BASE_URL}/en/category/${key}`);
    }
  });

  it('categoryServiceSchema returns null for unknown category', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(categoryServiceSchema('unknown')).toBeNull();
    spy.mockRestore();
  });
});

describe('eventSchema (public-gate + required fields)', () => {
  const validArgs = {
    isPublic: true,
    name: 'Ana & Marko',
    startDate: '2026-08-15T16:00:00',
    location: { name: 'Skopje City Hall' },
  };

  it('emits Event when isPublic===true and required fields present', () => {
    const s = eventSchema(validArgs);
    expect(s).not.toBeNull();
    expect(s['@type']).toBe('Event');
    expect(s.name).toBe('Ana & Marko');
    expect(s.startDate).toBe('2026-08-15T16:00:00');
    expect(s.location).toEqual({ '@type': 'Place', name: 'Skopje City Hall' });
  });

  it('drops schema when isPublic is anything other than boolean true', () => {
    for (const bad of [undefined, null, false, 0, 'true', 1, {}, 'yes']) {
      const s = eventSchema({ ...validArgs, isPublic: bad });
      expect(s).toBeNull();
    }
  });

  it('drops schema when startDate is missing (schema.org required)', () => {
    expect(eventSchema({ ...validArgs, startDate: undefined })).toBeNull();
  });

  it('drops schema when location is missing (schema.org required)', () => {
    expect(eventSchema({ ...validArgs, location: undefined })).toBeNull();
    expect(eventSchema({ ...validArgs, location: {} })).toBeNull();
  });

  it('accepts string location and wraps it in a Place', () => {
    const s = eventSchema({ ...validArgs, location: 'Skopje' });
    expect(s.location).toEqual({ '@type': 'Place', name: 'Skopje' });
  });

  it('never emits private-only fields even when passed extra keys', () => {
    const s = eventSchema({
      ...validArgs,
      guestEmails: ['leak@example.com'],
      rsvpToken: 'secret-token',
      privateNotes: 'do not share',
    });
    const serialized = JSON.stringify(s);
    expect(serialized).not.toContain('leak@example.com');
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('privateNotes');
  });
});

describe('localBusinessSchema (vendor placeholder)', () => {
  it('emits LocalBusiness when name and address present', () => {
    const s = localBusinessSchema({
      name: 'Wedding Cakes Ltd',
      address: { streetAddress: 'Blvd 1', addressLocality: 'Skopje', addressCountry: 'MK' },
      telephone: '+38970000000',
      priceRange: '€€',
      geo: { latitude: 41.9973, longitude: 21.428 },
    });
    expect(s['@type']).toBe('LocalBusiness');
    expect(s.address['@type']).toBe('PostalAddress');
    expect(s.address.addressLocality).toBe('Skopje');
    expect(s.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 41.9973, longitude: 21.428 });
  });

  it('drops schema when address has no fields', () => {
    expect(localBusinessSchema({ name: 'X', address: {} })).toBeNull();
  });

  it('drops geo when lat/lng are not finite numbers', () => {
    const s = localBusinessSchema({
      name: 'X',
      address: { streetAddress: 'Blvd 1' },
      geo: { latitude: 'foo', longitude: 21.428 },
    });
    expect(s.geo).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  2) DOM emission tests via <JsonLd> component                      */
/* ------------------------------------------------------------------ */

describe('<JsonLd> DOM emission', () => {
  it('injects a parseable <script type="application/ld+json"> for a valid schema', async () => {
    const w = mount(JsonLd, { props: { schema: organizationSchema({ logo: 'x' }), id: 't1' } });
    await nextTick();

    const scripts = readAllJsonLd();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].node.getAttribute('data-jsonld-id')).toBe('t1');
    expect(scripts[0].json['@type']).toBe('Organization');
    w.unmount();
  });

  it('does NOT emit any <script> when the schema prop is null', async () => {
    const w = mount(JsonLd, { props: { schema: null, id: 't2' } });
    await nextTick();
    expect(readAllJsonLd()).toHaveLength(0);
    w.unmount();
  });

  it('emits multiple <script> tags for an array of schemas', async () => {
    const w = mount(JsonLd, {
      props: {
        id: 't3',
        schema: [
          organizationSchema({ logo: 'x' }),
          webSiteSchema({}),
        ],
      },
    });
    await nextTick();

    const scripts = readAllJsonLd();
    expect(scripts).toHaveLength(2);
    expect(scripts.map(s => s.json['@type']).sort()).toEqual(['Organization', 'WebSite']);
    w.unmount();
  });

  it('drops null entries from a mixed array (never emits an empty object)', async () => {
    const w = mount(JsonLd, {
      props: {
        id: 't3b',
        schema: [organizationSchema({ logo: 'x' }), null, undefined, webSiteSchema({})],
      },
    });
    await nextTick();
    expect(readAllJsonLd()).toHaveLength(2);
    w.unmount();
  });

  it('removes its <script> tags on unmount', async () => {
    const w = mount(JsonLd, { props: { schema: organizationSchema({ logo: 'x' }), id: 't4' } });
    await nextTick();
    expect(readAllJsonLd()).toHaveLength(1);

    w.unmount();
    await nextTick();
    expect(readAllJsonLd()).toHaveLength(0);
  });

  it('updates when the reactive schema changes', async () => {
    // Wrap in a parent so we can flip the prop reactively.
    const Parent = defineComponent({
      components: { JsonLd },
      setup() {
        const schema = ref(organizationSchema({ logo: 'x' }));
        return { schema };
      },
      render() {
        return h(JsonLd, { schema: this.schema, id: 't5' });
      },
    });

    const w = mount(Parent);
    await nextTick();
    expect(readAllJsonLd()[0].json['@type']).toBe('Organization');

    w.vm.schema = webSiteSchema({});
    await nextTick();

    const after = readAllJsonLd();
    expect(after).toHaveLength(1);
    expect(after[0].json['@type']).toBe('WebSite');
    w.unmount();
  });

  it('two <JsonLd> instances with different ids do not clobber each other', async () => {
    const a = mount(JsonLd, { props: { schema: organizationSchema({ logo: 'x' }), id: 'A' } });
    const b = mount(JsonLd, { props: { schema: webSiteSchema({}), id: 'B' } });
    await nextTick();

    const scripts = readAllJsonLd();
    expect(scripts).toHaveLength(2);
    expect(scripts.map(s => s.node.getAttribute('data-jsonld-id')).sort()).toEqual(['A', 'B']);

    a.unmount();
    await nextTick();
    expect(readAllJsonLd()).toHaveLength(1);
    expect(readAllJsonLd()[0].node.getAttribute('data-jsonld-id')).toBe('B');
    b.unmount();
  });

  it('injected JSON round-trips through JSON.parse (well-formed)', async () => {
    const schema = eventSchema({
      isPublic: true,
      name: 'Ana & "Marko"', // contains a quote — must round-trip
      startDate: '2026-08-15T16:00:00',
      location: { name: 'Skopje <City Hall>' },
    });
    const w = mount(JsonLd, { props: { schema, id: 't6' } });
    await nextTick();

    const [{ node, json }] = readAllJsonLd();
    // JSON.parse would throw on invalid; the assignment implicitly validates it.
    expect(json.name).toBe('Ana & "Marko"');
    expect(json.location.name).toBe('Skopje <City Hall>');
    // Sanity: script uses textContent, not innerHTML — so raw < shouldn't break parsing
    expect(typeof node.textContent).toBe('string');
    w.unmount();
  });
});
