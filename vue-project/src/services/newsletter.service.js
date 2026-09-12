import publicApi from '@/services/backendApi'

/**
 * The blog's mailing list.
 *
 * <p>Deliberately not `/public/discounts/subscribe`, which is the nearest
 * existing endpoint: that one is the discount waiting list and its `name` is
 * `@NotBlank`, so signing up from a one-field form would mean either loosening
 * that contract for every caller or storing an invented name. Two lists that
 * are asked for in two places, kept as two lists.
 *
 * <p>Goes through `backendApi`, not `api`. The two clients differ by one thing
 * that matters here: `api` prefixes every path with `/v1/api`, and the public
 * controllers under `/public/*` are not behind it. Using the wrong one is a
 * 404 that looks exactly like a missing endpoint.
 */
export const newsletterService = {
  /** @param locale which language the reader wants the mail in. */
  subscribe(email, locale) {
    return publicApi.post('/public/newsletter/subscribe', { email, locale })
  },
}
