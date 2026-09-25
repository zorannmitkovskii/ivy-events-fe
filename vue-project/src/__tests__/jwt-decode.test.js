import { describe, it, expect } from "vitest";
import { decodeJwtPayload } from "@/services/jwt";

/**
 * Regression cover for the decoder that reads the access token's claims.
 *
 * The two cases that broke it in the app were not exotic: a base64url payload
 * containing `-` or `_`, and a Macedonian first name in `given_name`. Both
 * made the old `JSON.parse(atob(...))` throw, `getRoles()` return `[]`, and a
 * signed-in vendor get bounced off their own dashboard — with nothing on
 * screen or in the console to say why.
 */
function encode(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function token(payload) {
  return `header.${encode(payload)}.signature`;
}

describe("decodeJwtPayload", () => {
  it("reads a plain ASCII payload", () => {
    const claims = decodeJwtPayload(token({ sub: "abc", email: "user@ivy.test" }));
    expect(claims).toEqual({ sub: "abc", email: "user@ivy.test" });
  });

  it("reads Cyrillic claims, which are UTF-8 and not one byte per character", () => {
    const claims = decodeJwtPayload(
      token({ given_name: "Филип", family_name: "Фотограф", realm_access: { roles: ["VENDOR_MEMBER", "USER"] } })
    );

    expect(claims.given_name).toBe("Филип");
    expect(claims.family_name).toBe("Фотограф");
    expect(claims.realm_access.roles).toContain("VENDOR_MEMBER");
  });

  it("reads a payload whose base64url form uses - and _", () => {
    // 0xFB 0xFF encodes to "+/" in base64 and "-_" in base64url; `atob` on the
    // base64url form is what used to throw.
    const payload = { marker: "ûÿ", roles: ["ADMIN"] };
    const encoded = encode(payload);

    expect(encoded).toMatch(/[-_]/);
    expect(decodeJwtPayload(`h.${encoded}.s`)).toEqual(payload);
  });

  it("survives the padding a JWT strips", () => {
    // A one-character claim value puts the payload's length off a multiple of
    // four, so the `=` padding `atob` wants is missing.
    const claims = decodeJwtPayload(token({ a: "b" }));
    expect(claims).toEqual({ a: "b" });
  });

  it("returns null rather than throwing on anything unreadable", () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload(undefined)).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
    expect(decodeJwtPayload("header..signature")).toBeNull();
    expect(decodeJwtPayload("header.@@@notbase64@@@.signature")).toBeNull();
  });
});
