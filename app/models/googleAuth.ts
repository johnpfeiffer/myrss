export const GOOGLE_CLIENT_ID =
  "450775827270-1vuu8vvrmmtkedujs2dh2h0lmj2mjgfn.apps.googleusercontent.com";

const expirationLeewayMs = 30_000;

export interface GoogleProfile {
  expiresAt: number;
  email?: string;
  name?: string;
  pictureUrl?: string;
}

interface GoogleCredentialPayload {
  exp?: unknown;
  email?: unknown;
  name?: unknown;
  picture?: unknown;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}

export function decodeGoogleCredential(
  credential: string,
): GoogleProfile | null {
  try {
    const encodedPayload = credential.split(".")[1];
    if (!encodedPayload) {
      return null;
    }
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as GoogleCredentialPayload;
    if (typeof payload.exp !== "number") {
      return null;
    }
    return {
      expiresAt: payload.exp * 1_000,
      ...(typeof payload.email === "string" ? { email: payload.email } : {}),
      ...(typeof payload.name === "string" ? { name: payload.name } : {}),
      ...(typeof payload.picture === "string"
        ? { pictureUrl: payload.picture }
        : {}),
    };
  } catch {
    return null;
  }
}

export function isCredentialUsable(
  credential: string,
  now = Date.now(),
): boolean {
  const profile = decodeGoogleCredential(credential);
  return profile !== null && profile.expiresAt - expirationLeewayMs > now;
}
