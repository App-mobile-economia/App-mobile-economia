// Service worker (faz o app funcionar sem internet).
// Regra: "rede primeiro, cache como reserva".
//  - Com internet: busca sempre na internet, para o app nunca ficar desatualizado.
//  - Sem internet: usa a cópia guardada do próprio app.

// Nome do cache. Ao mudar o número, o cache antigo é apagado.
const CACHE = 'economia-hoje-v2';

// Arquivos que sempre são guardados na instalação.
const ARQUIVOS_BASICOS = ['/', '/manifest.json', '/logo192.png', '/logo512.png'];

// Guarda a página e os arquivos do app, para abrir offline desde o 2º acesso.
async function guardarArquivos() {
  const cache = await caches.open(CACHE);
  await cache.addAll(ARQUIVOS_BASICOS);

  // Os arquivos do app têm um código no nome (ex.: entry-abc123.js).
  // Por isso lemos a página e procuramos os endereços que ela cita.
  try {
    const resposta = await fetch('/');
    const html = await resposta.text();
    const achados = html.matchAll(/(?:src|href)="(\/_expo\/[^"]+)"/g);

    const enderecos = [];
    for (const achado of achados) {
      enderecos.push(achado[1]);
    }
    await cache.addAll(enderecos);
  } catch (erro) {
    // Se falhar, os arquivos são guardados aos poucos, conforme forem pedidos.
  }
}

// Instalação: guarda os arquivos e já ativa esta versão.
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    guardarArquivos().then(() => {
      self.skipWaiting();
    }),
  );
});

// Ativação: apaga os caches de versões antigas e assume o controle das abas abertas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(apagarCachesAntigos().then(() => self.clients.claim()));
});

async function apagarCachesAntigos() {
  const nomes = await caches.keys();
  for (const nome of nomes) {
    if (nome !== CACHE) {
      await caches.delete(nome);
    }
  }
}

// Cada pedido do app passa por aqui.
self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;

  // Só guardamos arquivos do próprio site (as APIs e o Supabase ficam de fora).
  const mesmoSite = new URL(pedido.url).origin === self.location.origin;
  if (pedido.method !== 'GET' || !mesmoSite) {
    return;
  }

  evento.respondWith(buscarNaInternetOuNoCache(pedido));
});

async function buscarNaInternetOuNoCache(pedido) {
  try {
    const resposta = await fetch(pedido);

    // Só guarda respostas boas (não páginas de erro).
    if (resposta.ok) {
      const cache = await caches.open(CACHE);
      cache.put(pedido, resposta.clone());
    }
    return resposta;
  } catch (erro) {
    // Sem internet: usa o que está guardado. Se não achar, abre a página inicial.
    const guardado = await caches.match(pedido);
    if (guardado) {
      return guardado;
    }
    return caches.match('/');
  }
}
