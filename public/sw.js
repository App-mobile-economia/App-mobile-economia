// Service worker simples: "rede primeiro, cache como reserva".
// Tenta sempre a internet (para o app nunca ficar desatualizado).
// Se não houver conexão, usa a cópia guardada do próprio app.
const CACHE = 'economia-hoje-v2';
const BASICOS = ['/', '/manifest.json', '/logo192.png', '/logo512.png'];

// Na instalação já guarda a página e os arquivos do app, para abrir offline desde o 2º acesso.
async function guardarBasico() {
  const cache = await caches.open(CACHE);
  await cache.addAll(BASICOS);
  // Os arquivos do app têm código no nome (ex.: entry-abc123.js): descobre pelos que a página cita.
  try {
    const html = await (await fetch('/')).text();
    const arquivos = [...html.matchAll(/(?:src|href)="(\/_expo\/[^"]+)"/g)].map((m) => m[1]);
    await cache.addAll(arquivos);
  } catch {
    // Se falhar, os arquivos são guardados aos poucos, conforme forem pedidos.
  }
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(guardarBasico().then(() => self.skipWaiting()));
});

// Apaga caches de versões antigas e assume o controle das abas abertas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  // Só guardamos arquivos do próprio site (as APIs e o Supabase ficam de fora).
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        // Só guarda respostas boas (não páginas de erro).
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(pedido).then((guardado) => guardado || caches.match('/'))),
  );
});
