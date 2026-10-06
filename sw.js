// Treinos — service worker
// Guarda o app para abrir sem internet. Os dados ficam no aparelho, nunca aqui.
const CACHE = 'treinos-v4';
const ARQUIVOS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // o Supabase nunca passa por aqui: sincronizacao precisa ir sempre a rede
  if (url.origin !== self.location.origin) return;

  // a propria pagina: busca ignorando o cache do navegador, para a versao nova chegar
  const ehPagina = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  e.respondWith(
    fetch(ehPagina ? new Request(req.url, { cache: 'reload', credentials: 'same-origin' }) : req)
      .then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
