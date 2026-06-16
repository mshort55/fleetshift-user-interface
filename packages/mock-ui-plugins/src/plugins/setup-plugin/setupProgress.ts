const DB_NAME = "ome-setup-progress";
const DB_VERSION = 1;
const STORE_NAME = "steps";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function getProgress(): Promise<Record<string, boolean>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const cursor = store.openCursor();
    const result: Record<string, boolean> = {};

    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        if (typeof c.key === "string" && typeof c.value === "boolean") {
          result[c.key] = c.value;
        }
        c.continue();
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve(result);
  });
}

async function setStepComplete(
  stepId: string,
  complete: boolean,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(complete, stepId);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
  });
}

export type SetupProgressStore = {
  getProgress: typeof getProgress;
  setStepComplete: typeof setStepComplete;
  subscribe: (listener: (state: Record<string, boolean>) => void) => () => void;
};

let store: SetupProgressStore | null = null;

export function getSetupProgressStore(): SetupProgressStore {
  if (!store) {
    const subs = new Set<(state: Record<string, boolean>) => void>();

    async function notify() {
      const state = await getProgress();
      for (const cb of subs) {
        cb(state);
      }
    }

    store = {
      getProgress,
      setStepComplete: async (stepId, complete) => {
        await setStepComplete(stepId, complete);
        await notify();
      },
      subscribe(cb) {
        subs.add(cb);
        return () => {
          subs.delete(cb);
        };
      },
    };
  }
  return store;
}
