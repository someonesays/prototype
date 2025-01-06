export const { get: getMinigameStore, set: setMinigameStore, delete: deleteMinigameStore } = await getIndexedDB();

export function getIndexedDB(): Promise<{
  get: (id: string) => Promise<string | Uint8Array | null>;
  set: (id: string, value: string | Uint8Array | null | undefined) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
}> {
  return new Promise((resolve) => {
    const opener: IDBOpenDBRequest = indexedDB.open("someonesays", 1);

    opener.onupgradeneeded = (evt: IDBVersionChangeEvent) => {
      const db = (evt.target as IDBOpenDBRequest).result;
      db.createObjectStore("minigames", { keyPath: "id" });
    };

    opener.onerror = (err: Event) => {
      console.error(err);
      resolve({
        get: async (_id: string) => null,
        set: async (_id: string, _value: string | Uint8Array | null | undefined) => false,
        delete: async (_id: string) => false,
      });
    };

    opener.onsuccess = (evt: Event) => {
      const db = (evt.target as IDBOpenDBRequest).result;
      return resolve({
        get: (id: string) => {
          return new Promise((resolve) => {
            const tx = db.transaction("minigames", "readonly");
            const store = tx.objectStore("minigames");

            const request = store.get(id);

            request.onsuccess = (evt) => resolve((evt.target as IDBRequest).result?.value ?? null);
            request.onerror = () => resolve(null);
          });
        },
        set: (id: string, value: string | Uint8Array | null | undefined) => {
          return new Promise<boolean>((resolve) => {
            const tx = db.transaction("minigames", "readwrite");
            const store = tx.objectStore("minigames");

            let request: IDBRequest;
            if (value === null || value === undefined) {
              request = store.delete(id);
            } else {
              request = store.put({ id, value });
            }

            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
          });
        },
        delete: (id: string) => {
          return new Promise<boolean>((resolve) => {
            const tx = db.transaction("minigames", "readwrite");
            const store = tx.objectStore("minigames");

            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
          });
        },
      });
    };
  });
}
