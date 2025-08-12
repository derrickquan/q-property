// lib/auth.ts
// Simple client-side auth using localStorage + a small event bus.
// This is NOT secure; it's just for demos/prototypes.

export type AuthEvent = "login" | "logout" | "update";

export type AuthUser = {
  email: string;
  firstName?: string;
  lastName?: string;
};

type StoredUser = AuthUser & { password: string };

const AUTH_USER_KEY = "auth_user";
const USERS_KEY = "auth_users_seed";
const SEEDED_KEY = "auth_default_seeded";

/** SSR-safe localStorage getters/setters */
function hasWindow() {
  return typeof window !== "undefined";
}

function readAuthUser(): AuthUser | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeAuthUser(user: AuthUser | null) {
  if (!hasWindow()) return;
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
  dispatchAuthEvent(user ? "login" : "logout");
}

function readUsers(): StoredUser[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (!hasWindow()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Basic event bus (works cross-tab via 'storage' and in-tab via CustomEvent) */
function dispatchAuthEvent(type: AuthEvent) {
  if (!hasWindow()) return;
  try {
    window.dispatchEvent(new CustomEvent("q-auth", { detail: { type } }));
  } catch {
    // no-op
  }
}

/**
 * Subscribe to auth changes (login/logout/update). Returns an unsubscribe fn.
 * Works across tabs (listens to localStorage `storage` events) and in-tab via CustomEvent.
 */
export function onAuthEvent(cb: (type: AuthEvent) => void): () => void {
  if (!hasWindow()) return () => {};

  const customHandler = (e: Event) => {
    const detail = (e as CustomEvent).detail as { type?: AuthEvent } | undefined;
    cb(detail?.type ?? "update");
  };

  const storageHandler = (e: StorageEvent) => {
    if (e.key === AUTH_USER_KEY || e.key === USERS_KEY) {
      cb("update");
    }
  };

  window.addEventListener("q-auth", customHandler as EventListener);
  window.addEventListener("storage", storageHandler);

  // Emit an immediate "update" so listeners can sync current state
  queueMicrotask(() => cb("update"));

  return () => {
    window.removeEventListener("q-auth", customHandler as EventListener);
    window.removeEventListener("storage", storageHandler);
  };
}

/** Public API */

/** Returns the currently logged-in user (or null). */
export function getUser(): AuthUser | null {
  return readAuthUser();
}

/** Log out the current user. */
export function logout() {
  writeAuthUser(null);
}

/** Seed a default user if none exists yet. */
export function ensureDefaultUser() {
  if (!hasWindow()) return;
  try {
    const seeded = window.localStorage.getItem(SEEDED_KEY);
    if (seeded) return;

    const users = readUsers();
    const alreadyHasJohn = users.some(
      (u) => u.email.toLowerCase() === "johnsmith@gmail.com"
    );

    if (!alreadyHasJohn) {
      users.push({
        email: "JohnSmith@gmail.com",
        password: "123",
        firstName: "John",
        lastName: "Smith",
      });
      writeUsers(users);
    }

    window.localStorage.setItem(SEEDED_KEY, "1");
  } catch {
    // no-op
  }
}

/** Register a new user (if email not already taken). */
export function signUp(params: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): { ok: true } | { ok: false; error: string } {
  if (!hasWindow()) return { ok: false, error: "Unavailable (SSR)" };

  const email = params.email.trim();
  const password = params.password;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const users = readUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { ok: false, error: "User already exists." };
  }

  users.push({
    email,
    password,
    firstName: params.firstName?.trim(),
    lastName: params.lastName?.trim(),
  });
  writeUsers(users);
  dispatchAuthEvent("update");
  return { ok: true };
}

/** Attempt to sign in; returns {ok:false,error} if invalid credentials. */
export function signIn(email: string, password: string): { ok: true } | { ok: false; error: string } {
  if (!hasWindow()) return { ok: false, error: "Unavailable (SSR)" };

  const users = readUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!found || found.password !== password) {
    return { ok: false, error: "Invalid email or password." };
  }

  const authUser: AuthUser = {
    email: found.email,
    firstName: found.firstName,
    lastName: found.lastName,
  };
  writeAuthUser(authUser);
  return { ok: true };
}
