import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ConvexProviderWithAuth,
  type ConvexReactClient,
} from "convex/react";

import {
  decodeGoogleCredential,
  GOOGLE_CLIENT_ID,
  isCredentialUsable,
  type GoogleProfile,
} from "../models/googleAuth";

const credentialStorageKey = "favorites.googleCredential";
const googleScriptId = "google-identity-services";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  disableAutoSelect(): void;
  initialize(config: {
    callback: (response: GoogleCredentialResponse) => void;
    client_id: string;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      shape?: "rectangular" | "pill";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with";
      theme?: "outline" | "filled_blue" | "filled_black";
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

interface GoogleAuthContextValue {
  credential: string | null;
  error: string | null;
  isGoogleReady: boolean;
  profile: GoogleProfile | null;
  signOut: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(
      googleScriptId,
    ) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    const handleLoad = () => resolve();
    const handleError = () => {
      googleScriptPromise = null;
      reject(new Error("Google Sign-In could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!existing) {
      script.async = true;
      script.defer = true;
      script.id = googleScriptId;
      script.src = "https://accounts.google.com/gsi/client";
      document.head.append(script);
    }
  });
  return googleScriptPromise;
}

function readStoredCredential(): string | null {
  const credential = window.sessionStorage.getItem(credentialStorageKey);
  if (credential && isCredentialUsable(credential)) {
    return credential;
  }
  window.sessionStorage.removeItem(credentialStorageKey);
  return null;
}

// The provider and its consumer hook intentionally share this private context.
// eslint-disable-next-line react-refresh/only-export-components
export function useGoogleAuth(): GoogleAuthContextValue {
  const value = useContext(GoogleAuthContext);
  if (!value) {
    throw new Error("GoogleAuthProvider is missing.");
  }
  return value;
}

function useGoogleAuthForConvex() {
  const { credential, isGoogleReady, signOut } = useGoogleAuth();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (
        forceRefreshToken ||
        !credential ||
        !isCredentialUsable(credential)
      ) {
        signOut();
        return null;
      }
      return credential;
    },
    [credential, signOut],
  );

  return useMemo(
    () => ({
      isLoading: !isGoogleReady,
      isAuthenticated: credential !== null,
      fetchAccessToken,
    }),
    [credential, fetchAccessToken, isGoogleReady],
  );
}

export function GoogleAuthProvider({
  children,
  client,
}: {
  children: ReactNode;
  client: ConvexReactClient;
}) {
  const [credential, setCredential] = useState(readStoredCredential);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const profile = useMemo(
    () => (credential ? decodeGoogleCredential(credential) : null),
    [credential],
  );

  const receiveCredential = useCallback((nextCredential: string) => {
    if (!isCredentialUsable(nextCredential)) {
      setError("Google returned an expired or invalid credential.");
      return;
    }
    window.sessionStorage.setItem(credentialStorageKey, nextCredential);
    setCredential(nextCredential);
    setError(null);
  }, []);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(credentialStorageKey);
    window.google?.accounts.id.disableAutoSelect();
    setCredential(null);
  }, []);

  useEffect(() => {
    let active = true;
    void loadGoogleIdentityServices()
      .then(() => {
        if (!active || !window.google) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              receiveCredential(response.credential);
            }
          },
        });
        setIsGoogleReady(true);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Google Sign-In could not be loaded.",
          );
          setIsGoogleReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [receiveCredential]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const remaining = profile.expiresAt - Date.now() - 30_000;
    if (remaining <= 0) {
      signOut();
      return;
    }
    const timer = window.setTimeout(signOut, remaining);
    return () => window.clearTimeout(timer);
  }, [profile, signOut]);

  const value = useMemo(
    () => ({
      credential,
      error,
      isGoogleReady,
      profile,
      signOut,
    }),
    [credential, error, isGoogleReady, profile, signOut],
  );

  return (
    <GoogleAuthContext.Provider value={value}>
      <ConvexProviderWithAuth client={client} useAuth={useGoogleAuthForConvex}>
        {children}
      </ConvexProviderWithAuth>
    </GoogleAuthContext.Provider>
  );
}

// Google owns the injected button DOM, so rendering remains an imperative API.
// eslint-disable-next-line react-refresh/only-export-components
export function renderGoogleSignInButton(parent: HTMLElement): void {
  if (!window.google) {
    return;
  }
  parent.replaceChildren();
  window.google.accounts.id.renderButton(parent, {
    shape: "rectangular",
    size: "large",
    text: "signin_with",
    theme: "outline",
  });
}
