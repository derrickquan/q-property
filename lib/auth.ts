// lib/auth.ts
// Tiny auth on top of lib/data.ts (localStorage today, backend-ready for later)

import { db } from "./data";

type ID = string;
export type User = {
  id: ID;
  email: string;
  password: string; // plain in local demo only — replace with hash when backend added
  createdAt: number;
};

const SESSION_KEY = "qprop:session";

// seed default user once
export async function ensureDefaultUser() {
  const users = await db.list<User>("users");
  const exists = users.some(
    u => u.email.toLowerCase() === "johnsmith@gmail.com"
  );
  if (!exists) {
    await db.add<User>("users", {
      email: "JohnSmith@gmail.com",
      password: "123",
      createdAt: Date.now(),
    } as any);
  }
}

export async function signUp(email: string, password: string) {
  email = email.trim();
  if (!email || !password) throw new Error("Email and password are required.");
  const users = await db.list<User>("users");
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const user = await db.add<User>("users", {
    email,
    password,
    createdAt: Date.now(),
  } as any);
  setSession(user.id);
  return user;
}

export async function signIn(email: string, password: string) {
  const users = await db.list<User>("users");
  const user = users.find(
    u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!user) throw new Error("Invalid email or password.");
  setSession(user.id);
  return user;
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent("db:update", { detail: { key: SESSION_KEY } }));
  }
}

export async function currentUser(): Promise<User | null> {
  const id = getSession();
  if (!id) return null;
  const u = await db.get<User>("users", id);
  return u ?? null;
}

function setSession(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
  window.dispatchEvent(new CustomEvent("db:update", { detail: { key: SESSION_KEY } }));
}

function getSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw).userId as string) : null;
  } catch {
    return null;
  }
}
