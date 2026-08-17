import { describe, expect, test } from "vitest";

import {
  convexAccessToken,
  decodeGoogleCredential,
  isCredentialUsable,
} from "./googleAuth";

function credential(payload: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return `header.${btoa(binary).replaceAll("=", "")}.signature`;
}

describe("Google credential helpers", () => {
  test("reads the display profile and expiration from an ID token", () => {
    expect(
      decodeGoogleCredential(
        credential({
          exp: 2_000,
          email: "person@example.com",
          name: "Éxample Person",
          picture: "https://example.com/photo.jpg",
        }),
      ),
    ).toEqual({
      expiresAt: 2_000_000,
      email: "person@example.com",
      name: "Éxample Person",
      pictureUrl: "https://example.com/photo.jpg",
    });
  });

  test("rejects malformed and nearly expired credentials", () => {
    expect(decodeGoogleCredential("not-a-jwt")).toBeNull();
    expect(isCredentialUsable(credential({ exp: 100 }), 75_000)).toBe(false);
    expect(isCredentialUsable(credential({ exp: 200 }), 75_000)).toBe(true);
  });

  test("reuses a valid Google JWT when Convex requests a forced token fetch", () => {
    const token = credential({ exp: 200 });

    expect(
      convexAccessToken(token, { forceRefreshToken: false }, 75_000),
    ).toBe(token);
    expect(
      convexAccessToken(token, { forceRefreshToken: true }, 75_000),
    ).toBe(token);
    expect(
      convexAccessToken(token, { forceRefreshToken: true }, 175_000),
    ).toBeNull();
  });
});
