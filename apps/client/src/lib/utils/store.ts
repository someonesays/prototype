let db: IDBDatabase;
const opener: IDBOpenDBRequest = indexedDB.open("someonesays", 1);

opener.onupgradeneeded = (evt: IDBVersionChangeEvent) => {
  db = (evt.target as IDBOpenDBRequest).result;
  db.createObjectStore("minigames", { keyPath: "id" });
};

opener.onsuccess = (evt: Event) => {
  db = (evt.target as IDBOpenDBRequest).result;
};

export function getMinigameStore(id: string) {
  if (!db) return null;

  return new Promise<string | Uint8Array | null>((resolve) => {
    const tx = db.transaction("minigames", "readonly");
    const store = tx.objectStore("minigames");

    const request = store.get(id);

    request.onsuccess = (evt) => resolve((evt.target as IDBRequest).result?.value ?? null);
    request.onerror = () => resolve(null);
  });
}

export function setMinigameStore(id: string, value: string | Uint8Array | null | undefined) {
  if (!db) return false;
  if (value === undefined || value === null) return deleteMinigameStore(id);

  return new Promise<boolean>((resolve) => {
    const tx = db.transaction("minigames", "readwrite");
    const store = tx.objectStore("minigames");

    const request = store.put({ id, value });

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

export function deleteMinigameStore(id: string) {
  if (!db) return false;

  return new Promise<boolean>((resolve) => {
    const tx = db.transaction("minigames", "readwrite");
    const store = tx.objectStore("minigames");

    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}
