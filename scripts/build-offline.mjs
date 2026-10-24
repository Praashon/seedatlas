import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve(import.meta.dirname, '../apps/web/dist');
function list(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = prefix + '/' + entry.name;
    return entry.isDirectory() ? list(resolve(directory, entry.name), name) : [name];
  });
}
const files = list(output).filter(file => file !== '/sw.js');
const hash = createHash('sha256');
for (const file of files) hash.update(readFileSync(resolve(output, '.' + file)));
const cacheName = 'seedatlas-' + hash.digest('hex').slice(0, 16);
writeFileSync(resolve(output, 'sw.js'), `
const CACHE = ${JSON.stringify(cacheName)};
const FILES = ${JSON.stringify(['/', ...files])};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('seedatlas-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // These are public, same-origin build files with identical content for
    // every Origin. Preview servers may attach Vary: Origin to module files.
    const match = await cache.match(event.request, { ignoreVary: true });
    if (match) return match;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') {
        const page = await cache.match('/index.html');
        if (page) return page;
      }
      throw error;
    }
  }));
});
`);
console.log(`Offline cache prepared: ${files.length} static files, ${cacheName}.`);
