// lib/data.ts
// Backend-ready data layer: today uses localStorage, later swap to Firebase with same API.

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function read<T = any>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T = any>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  // fire a manual event so same-tab listeners can react
  window.dispatchEvent(new CustomEvent("db:update", { detail: { key } }));
}

/** Generic collection helpers */
const collKey = (name: string) => `qprop:${name}`;

export const db = {
  /** List all docs in a collection */
  async list<T = any>(collection: string): Promise<T[]> {
    return read<T[]>(collKey(collection), []);
  },

  /** Get one by id (object with {id}) */
  async get<T = any>(collection: string, id: string): Promise<T | undefined> {
    const items = read<any[]>(collKey(collection), []);
    return items.find(i => i?.id === id);
  },

  /** Add (if no id, we create one). Returns created item. */
  async add<T extends { id?: string }>(collection: string, doc: T): Promise<T & { id: string }> {
    const items = read<any[]>(collKey(collection), []);
    const id = doc.id ?? `${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const created = { ...doc, id };
    items.push(created);
    write(collKey(collection), items);
    return created as T & { id: string };
  },

  /** Upsert by id */
  async upsert<T extends { id: string }>(collection: string, doc: T): Promise<T> {
    const items = read<any[]>(collKey(collection), []);
    const idx = items.findIndex(i => i?.id === doc.id);
    const next = idx >= 0 ? [...items.slice(0, idx), doc, ...items.slice(idx + 1)] : [...items, doc];
    write(collKey(collection), next);
    return doc;
  },

  /** Remove by id */
  async remove(collection: string, id: string): Promise<void> {
    const items = read<any[]>(collKey(collection), []);
    write(
      collKey(collection),
      items.filter(i => i?.id !== id)
    );
  },

  /**
   * Subscribe to collection changes (same-tab and cross-tab).
   * Returns unsubscribe function.
   */
  watch(collection: string, callback: () => void): () => void {
    const key = collKey(collection);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === key) callback();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      window.addEventListener("db:update", onCustom as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("db:update", onCustom as EventListener);
      }
    };
  },
};

/* -------------------------------------------
   HOW TO SWAP TO FIREBASE LATER:
   - Replace the methods above with Firestore queries:
     list -> getDocs(query(collectionRef))
     get -> getDoc(docRef)
     add -> addDoc(collectionRef, data)
     upsert -> setDoc(docRef, data, { merge: true })
     remove -> deleteDoc(docRef)
     watch -> onSnapshot(collectionRef, callback)
   Keep the same function signatures so pages need no changes.
-------------------------------------------- */
