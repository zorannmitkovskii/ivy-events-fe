/**
 * Read the claims out of a JWT, without verifying it.
 *
 * <p>Reading only — the signature is the backend's business. What this exists
 * for is that `atob` alone cannot do it, and three places in the app were each
 * trying:
 *
 * <ul>
 *   <li>A JWT payload is base64<b>URL</b>: it uses `-` and `_` where base64
 *       uses `+` and `/`, and drops the `=` padding. `atob` rejects both.</li>
 *   <li>The decoded bytes are UTF-8. `atob` returns a binary string, so any
 *       non-ASCII claim — a Macedonian first name in `given_name`, which is
 *       most of them — came back as mojibake and `JSON.parse` threw.</li>
 * </ul>
 *
 * <p>Both failures were silent and looked like authorisation bugs. A vendor
 * signed in, carried VENDOR in their token, and was bounced off every
 * /vendor/* route to the couple's dashboard, because `getRoles()` read an
 * unparseable token as "no roles". Whether it happened at all depended on the
 * letters in the person's name.
 *
 * @param {string|null|undefined} token
 * @returns {object|null} the payload, or null if there is nothing readable
 */
export function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
