// lib/auth.ts
export type AuthUser = {
  name: string;
  email: string;
};

const KEY = "qp_user";

// Seed a default user so you can log in immediately
const DEFAULT = { name: "John Smith", email: "JohnSmith@gmail.com" } satisfies AuthUser;

/** Get the current user (or null if logged out). */
export function getUser(): AuthUser | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Is someone logged in? */
export function isLoggedIn(): boolean {
  return !!getUser();
}

/** Log in with a simple demo credential check. */
export function login(email: string, password: string): { ok: boolean; error?: string } {
  // Demo-only: a single user with a fixed password
  if (email.toLowerCase() === DEFAULT.email.toLowerCase() && password === "123") {
    window.localStorage.setItem(KEY, JSON.stringify(DEFAULT));
    notifyAuthChange();
    return { ok: true };
  }
  return { ok: false, error: "Invalid email or password" };
}

/** Create account (demo): always creates/overwrites the default user. */
export function startFree(name: string, email: string, password: string): { ok: boolean } {
  // Still a demo: we just store the provided name/email and accept any password.
  const user: AuthUser = { name: name.trim() || "New User", email: email.trim() };
  window.localStorage.setItem(KEY, JSON.stringify(user));
  notifyAuthChange();
  return { ok: true };
}

/** Log out. */
export function logout(): void {
  window.localStorage.removeItem(KEY);
  notifyAuthChange();
}

/** Subscribe to auth changes (both storage events and same-tab changes). */
export function onAuthChange(fn: () => void): () => void {
  const storageHandler = (e: StorageEvent) => {
    if (e.key === KEY) fn();
  };
  const customHandler = () => fn();

  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageHandler);
    window.addEventListener("qp-auth", customHandler as EventListener);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("qp-auth", customHandler as EventListener);
    }
  };
}

/** Fire a same-tab event so components update immediately after login/logout. */
function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("qp-auth"));
  }
}
