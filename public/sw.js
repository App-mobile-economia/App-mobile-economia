// Service worker simples: "rede primeiro, cache como reserva".
// Tenta sempre a internet (para o app nunca ficar desatualizado).
// Se não houver conexão, usa a cópia guardada do próprio app.
const CACHE = 'economia-hoje-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  // Só guardamos arquivos do próprio site (as APIs e o Supabase ficam de fora).
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        return resposta;
      })
      .catch(() => caches.match(pedido).then((guardado) => guardado || caches.match('/'))),
  );
});
