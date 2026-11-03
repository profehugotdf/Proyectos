/* Service worker de Proyectos: abre sin conexión y se actualiza solo cuando hay red. */
const V = 'proyectos-v7';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const copia = res.clone();
    caches.open(V).then(c => c.put(req, copia));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    // Archivos propios: primero la red (así llegan las actualizaciones); sin red, la copia guardada.
    e.respondWith(
      fetch(req).then(res => guardar(req, res)).catch(() =>
        caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))
      )
    );
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.host)) {
    // Tipografías: se guardan la primera vez y después salen del caché.
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => guardar(req, res))));
  }
});
