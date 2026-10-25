import { FIREBASE_CONFIG } from "./config";
import type {
  CollectionRef,
  DocRef,
  P2PStore,
  QuerySnapshot,
  Snapshot,
} from "./types";

const DEMO_KEY = "cs_demo_db";

type Row = Record<string, unknown>;

/**
 * Local stand-in for Firestore with the same shape, used when Firebase is not
 * reachable. Ported verbatim from the original `createLocalStore`.
 */
export function createLocalStore(): P2PStore {
  const read = (): Record<string, Row> => {
    try {
      return JSON.parse(localStorage.getItem(DEMO_KEY) || "{}") || {};
    } catch {
      return {};
    }
  };

  const listeners = new Set<() => void>();
  const notify = () =>
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error(error);
      }
    });

  const write = (data: Record<string, Row>) => {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(data));
    } catch {
      /* quota / private mode */
    }
    notify();
  };

  const snapOf = (path: string, data: Row | undefined): Snapshot => ({
    id: path.split("/").pop() as string,
    exists: data !== undefined,
    data: () => (data === undefined ? undefined : { ...data }),
  });

  const doc = (path: string): DocRef => ({
    id: path.split("/").pop() as string,
    path,
    get: async () => snapOf(path, read()[path]),
    set: async (d) => {
      const all = read();
      all[path] = JSON.parse(JSON.stringify(d));
      write(all);
    },
    update: async (d) => {
      const all = read();
      if (!all[path]) throw new Error("not found");
      all[path] = { ...all[path], ...JSON.parse(JSON.stringify(d)) };
      write(all);
    },
    delete: async () => {
      const all = read();
      delete all[path];
      write(all);
    },
    onSnapshot: (next) => {
      const fn = () => next(snapOf(path, read()[path]));
      listeners.add(fn);
      fn();
      return () => {
        listeners.delete(fn);
      };
    },
  });

  const query = (
    path: string,
    order?: { f: string; d: "asc" | "desc" },
    lim?: number,
  ): CollectionRef => {
    const run = (): QuerySnapshot => {
      const all = read();
      const depth = path.split("/").length + 1;
      let docs = Object.keys(all)
        .filter((k) => k.startsWith(path + "/") && k.split("/").length === depth)
        .map((k) => snapOf(k, all[k]));
      if (order) {
        docs.sort((a, b) => {
          const x = (a.data() as Row)[order.f] as number | string;
          const y = (b.data() as Row)[order.f] as number | string;
          return (x > y ? 1 : x < y ? -1 : 0) * (order.d === "desc" ? -1 : 1);
        });
      }
      if (lim) docs = docs.slice(0, lim);
      return { docs, size: docs.length, empty: !docs.length };
    };

    return {
      orderBy: (f, d = "asc") => query(path, { f, d }, lim),
      limit: (n) => query(path, order, n),
      get: async () => run(),
      doc: (id) => doc(path + "/" + id),
      onSnapshot: (next) => {
        const fn = () => next(run());
        listeners.add(fn);
        fn();
        return () => {
          listeners.delete(fn);
        };
      },
    };
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === DEMO_KEY) notify();
    });
  }

  return {
    doc,
    collection: (path) => query(path),
    async nextCode(build) {
      const all = read();
      const n = ((all["meta/contador"]?.ultimo as number) || 0) + 1;
      all["meta/contador"] = { ultimo: n };
      all["transacciones/" + String(n).padStart(4, "0")] = build(n);
      write(all);
      return n;
    },
  };
}

export interface TransferLike {
  get: (ref: unknown) => Promise<{
    exists: boolean;
    data: () => Record<string, unknown>;
  }>;
  set: (ref: unknown, data: Record<string, unknown>) => void;
}

export interface FirestoreCompat {
  doc: (path: string) => unknown;
  collection: (path: string) => unknown;
  runTransaction: (fn: (t: TransferLike) => Promise<unknown>) => Promise<unknown>;
}

export interface AuthUserLike {
  uid: string;
  email?: string | null;
}

export interface FirebaseAuthLike {
  onAuthStateChanged: (next: (user: AuthUserLike | null) => void) => () => void;
  signInWithPopup: (provider: unknown) => Promise<unknown>;
  signOut: () => Promise<void>;
}

export interface FirebaseLike {
  auth: (() => FirebaseAuthLike) & {
    GoogleAuthProvider: new () => unknown;
  };
}

interface FirebaseAppLike {
  apps: unknown[];
  initializeApp: (config: unknown) => unknown;
  firestore: () => FirestoreCompat;
  auth: () => FirebaseAuthLike;
}

interface ModuleLike {
  default?: FirebaseAppLike;
}

/** Firebase-backed store shared by every visitor. */
export async function createFirebaseStore(): Promise<{
  store: P2PStore;
  auth: FirebaseAuthLike;
  firebase: FirebaseLike;
}> {
  const appMod = (await import("firebase/compat/app")) as unknown as ModuleLike;
  await import("firebase/compat/auth");
  await import("firebase/compat/firestore");

  const firebase = (appMod.default ?? appMod) as unknown as FirebaseAppLike;
  // StrictMode mounts twice in dev; initializeApp throws on a second call.
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  const fs = firebase.firestore();

  const store: P2PStore = {
    doc: (p) => fs.doc(p) as DocRef,
    collection: (p) => fs.collection(p) as CollectionRef,
    // Correlative code inside a transaction: two purchases never share a number.
    async nextCode(build) {
      return fs.runTransaction(async (t) => {
        const cRef = fs.doc("meta/contador");
        const c = await t.get(cRef);
        const n = ((c.exists && (c.data().ultimo as number)) || 0) + 1;
        t.set(cRef, { ultimo: n });
        t.set(fs.doc("transacciones/" + String(n).padStart(4, "0")), build(n));
        return n;
      }) as Promise<number>;
    },
  };

  return {
    store,
    auth: firebase.auth(),
    firebase: firebase as unknown as FirebaseLike,
  };
}
