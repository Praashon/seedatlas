import type { World } from '../../../../packages/contracts';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('seedatlas', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('worlds', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error('Local storage is unavailable. Check browser storage permissions.'));
    request.onblocked = () =>
      reject(new Error('Close other SeedAtlas tabs to update local storage.'));
  });
}
export async function readWorlds(): Promise<World[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('worlds', 'readonly');
    const request = tx.objectStore('worlds').getAll();
    request.onsuccess = () => resolve(request.result as World[]);
    request.onerror = () => reject(new Error('Could not read your saved worlds.'));
    tx.oncomplete = () => db.close();
    tx.onabort = () => {
      db.close();
      reject(new Error('Could not read local storage.'));
    };
  });
}
export async function storeWorld(world: World): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('worlds', 'readwrite');
    tx.objectStore('worlds').put(world);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(new Error('Your changes could not be saved. Browser storage may be full.'));
    };
    tx.onerror = () => reject(new Error('Your changes could not be saved locally.'));
  });
}
export function exportJson(filename: string, value: unknown): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
