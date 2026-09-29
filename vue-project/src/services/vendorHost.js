import { getRuntimeEnv, siteDomainOf } from '@/services/env'

/**
 * Which vendor, if any, this hostname belongs to (IVY-706).
 *
 * <p>Every approved vendor gets `<slug>.ivyevents.mk` for free — the slug is
 * already unique and the platform already owns the parent domain, so there is
 * nothing to claim and no DNS record for the vendor to publish. A vendor who
 * later buys their own domain keeps this one working.
 *
 * <p>The decision is made here rather than in the router because it is one
 * question — "is this hostname a vendor's?" — and two copies of it would
 * disagree the first time the platform domain changed.
 */

/** Hostnames that are the platform itself, never a vendor. */
const RESERVED = new Set(['www', 'api', 'admin', 'app', 'test', 'dev', 'staging', 'mail', 'cdn', 'auth', 'iam']);

export function platformDomain() {
  const env = getRuntimeEnv();
  const configured = env.VITE_PLATFORM_DOMAIN;
  // A literal `${...}` is env.js served without substitution — see baseUrl.js
  // for the same guard and the reason it exists.
  const usable = configured && !/\$\{[^}]+\}/.test(configured) ? configured : null;
  // Otherwise read it off the address: on test.ivyevents.mk and its sites the
  // sites live under test.ivyevents.mk, with no configuration to forget on deploy.
  const host = typeof window === 'undefined' ? '' : window.location?.hostname;
  return usable || siteDomainOf(host) || 'ivyevents.mk';
}

/**
 * The vendor slug this page is for, and the host to ask the server about.
 *
 * @param pathSlug the `:slug` from `/:lang/s/:slug`, used in local development
 *   where there is no wildcard DNS to put a slug in front of the domain.
 */
export function resolveVendorHost(pathSlug) {
  const domain = platformDomain();
  const host = typeof window === 'undefined' ? '' : String(window.location.hostname || '').toLowerCase();

  const fromHost = subdomainOf(host, domain);
  if (fromHost) {
    return { host, slug: fromHost, platformDomain: domain, viaHost: true };
  }

  // Locally the hostname is `localhost`, so the slug travels in the path and
  // we hand the server the hostname it would have seen in production.
  const slug = pathSlug ? String(pathSlug).toLowerCase() : '';
  return {
    host: slug ? `${slug}.${domain}` : host,
    slug,
    platformDomain: domain,
    viaHost: false,
  };
}

/**
 * What the current hostname is, asked of the server.
 *
 * <p>A label under the platform domain can be a supplier's microsite or a
 * couple's invitation, and only the registry knows which — the two draw from
 * one namespace. Deciding it in the browser would mean a name could mean one
 * thing to the router and another to the API.
 *
 * <p>Answers null off a subdomain, and on one whose owner has not published.
 */
export async function siteTarget(api) {
  const { host, slug } = resolveVendorHost();
  if (!slug) return null;

  try {
    const answer = await api.get('/public/site', { params: { host } });
    return answer?.data ?? answer ?? null;
  } catch {
    // A hostname nobody has claimed is not an error worth a console entry;
    // it is the marketplace being asked about a name it does not serve.
    return null;
  }
}

/**
 * One label in front of the domain, and not a reserved one.
 *
 * <p>Only one label deep: `a.b.ivyevents.mk` is a mistake or a probe, and
 * accepting it would let one vendor be reached by unboundedly many addresses.
 */
function subdomainOf(host, domain) {
  const suffix = `.${domain}`;
  if (!host.endsWith(suffix)) return '';

  const label = host.slice(0, -suffix.length);
  if (!label || label.includes('.') || RESERVED.has(label)) return '';
  return label;
}
