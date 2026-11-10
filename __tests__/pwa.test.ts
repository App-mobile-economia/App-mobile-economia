import fs from 'fs';
import path from 'path';
import vm from 'vm';

const publico = path.join(__dirname, '..', 'public');

describe('manifest do PWA', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(publico, 'manifest.json'), 'utf8'));

  test('nome, início e modo de tela cheia', () => {
    expect(manifest.name).toBe('Economia Hoje');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  test('todos os ícones citados existem na pasta public', () => {
    for (const icone of manifest.icons) {
      expect(fs.existsSync(path.join(publico, icone.src))).toBe(true);
    }
  });

  test('tem ícones de 192 e 512 px, comuns e "maskable"', () => {
    const tamanhos = manifest.icons.map((i: any) => i.sizes + ':' + i.purpose);
    expect(tamanhos).toEqual(
      expect.arrayContaining(['192x192:any', '512x512:any', '192x192:maskable', '512x512:maskable']),
    );
  });

  test('a página inicial aponta para o manifest e registra o service worker', () => {
    const html = fs.readFileSync(path.join(publico, 'index.html'), 'utf8');
    expect(html).toContain('manifest.json');
    expect(html).toContain('serviceWorker');
    expect(html).toContain('sw.js');
  });
});

describe('service worker', () => {
  const codigo = fs.readFileSync(path.join(publico, 'sw.js'), 'utf8');

  // Executa o sw.js num ambiente falso e devolve os "ouvintes" que ele registrou.
  function carregar(opcoes: { caches?: Record<string, Map<string, unknown>>; fetch?: jest.Mock } = {}) {
    const ouvintes: Record<string, (e: any) => void> = {};
    const armazens: Record<string, Map<string, unknown>> = opcoes.caches ?? {};
    const adicionados: string[] = [];

    const cachesFalso = {
      open: async (nome: string) => {
        armazens[nome] = armazens[nome] ?? new Map();
        return {
          addAll: async (urls: string[]) => {
            adicionados.push(...urls);
          },
          put: async (pedido: { url: string }, resposta: unknown) => {
            armazens[nome].set(pedido.url, resposta);
          },
        };
      },
      keys: async () => Object.keys(armazens),
      delete: async (nome: string) => {
        delete armazens[nome];
        return true;
      },
      match: async (pedido: { url: string } | string) => {
        const url = typeof pedido === 'string' ? pedido : pedido.url;
        for (const armazem of Object.values(armazens)) {
          if (armazem.has(url)) return armazem.get(url);
        }
        return undefined;
      },
    };

    const ambiente: any = {
      self: {
        addEventListener: (tipo: string, funcao: (e: any) => void) => (ouvintes[tipo] = funcao),
        skipWaiting: jest.fn(),
        clients: { claim: jest.fn() },
        location: { origin: 'https://app.exemplo.com' },
      },
      caches: cachesFalso,
      fetch: opcoes.fetch ?? jest.fn(),
      URL,
      console,
    };
    vm.runInNewContext(codigo, ambiente);
    return { ouvintes, armazens, adicionados, ambiente };
  }

  test('registra os três ouvintes: install, activate e fetch', () => {
    const { ouvintes } = carregar();
    expect(Object.keys(ouvintes).sort()).toEqual(['activate', 'fetch', 'install']);
  });

  test('instalação guarda a página, o manifest, os ícones e os arquivos /_expo/ da página', async () => {
    const html = '<script src="/_expo/static/js/web/entry-abc.js"></script><link href="/_expo/static/css/x.css">';
    const buscar = jest.fn().mockResolvedValue({ text: async () => html });
    const { ouvintes, adicionados, ambiente } = carregar({ fetch: buscar });
    let espera: Promise<unknown> = Promise.resolve();
    ouvintes.install({ waitUntil: (p: Promise<unknown>) => (espera = p) });
    await espera;
    expect(adicionados).toEqual(
      expect.arrayContaining([
        '/',
        '/manifest.json',
        '/logo192.png',
        '/logo512.png',
        '/_expo/static/js/web/entry-abc.js',
        '/_expo/static/css/x.css',
      ]),
    );
    expect(ambiente.self.skipWaiting).toHaveBeenCalled();
  });

  test('instalação não falha se não conseguir ler a página', async () => {
    const buscar = jest.fn().mockRejectedValue(new Error('sem rede'));
    const { ouvintes, ambiente } = carregar({ fetch: buscar });
    let espera: Promise<unknown> = Promise.resolve();
    ouvintes.install({ waitUntil: (p: Promise<unknown>) => (espera = p) });
    await expect(espera).resolves.toBeUndefined();
    expect(ambiente.self.skipWaiting).toHaveBeenCalled();
  });

  test('ativação apaga os caches antigos e mantém só o atual', async () => {
    const { ouvintes, armazens, ambiente } = carregar({
      caches: { 'economia-hoje-v1': new Map(), 'economia-hoje-v2': new Map(), outro: new Map() },
    });
    let espera: Promise<unknown> = Promise.resolve();
    ouvintes.activate({ waitUntil: (p: Promise<unknown>) => (espera = p) });
    await espera;
    expect(Object.keys(armazens)).toEqual(['economia-hoje-v2']);
    expect(ambiente.self.clients.claim).toHaveBeenCalled();
  });

  function pedir(ouvintes: any, url: string, metodo = 'GET') {
    let resposta: Promise<any> | undefined;
    ouvintes.fetch({ request: { url, method: metodo }, respondWith: (p: Promise<any>) => (resposta = p) });
    return resposta;
  }

  test('ignora pedidos de outros sites (APIs e Supabase)', () => {
    const { ouvintes } = carregar();
    expect(pedir(ouvintes, 'https://api.bcb.gov.br/dados')).toBeUndefined();
    expect(pedir(ouvintes, 'https://xyz.supabase.co/rest/v1/favoritos')).toBeUndefined();
  });

  test('ignora pedidos que não são GET', () => {
    const { ouvintes } = carregar();
    expect(pedir(ouvintes, 'https://app.exemplo.com/x', 'POST')).toBeUndefined();
  });

  test('com internet: devolve a resposta nova e guarda uma cópia', async () => {
    const copia = { ok: true, copia: true };
    const resposta = { ok: true, clone: () => copia };
    const buscar = jest.fn().mockResolvedValue(resposta);
    const { ouvintes, armazens } = carregar({ fetch: buscar });
    const devolvida = await pedir(ouvintes, 'https://app.exemplo.com/pagina');
    expect(devolvida).toBe(resposta);
    expect(armazens['economia-hoje-v2'].get('https://app.exemplo.com/pagina')).toBe(copia);
  });

  test('resposta com erro (404/500) não é guardada', async () => {
    const resposta = { ok: false, clone: jest.fn() };
    const { ouvintes, armazens } = carregar({ fetch: jest.fn().mockResolvedValue(resposta) });
    await pedir(ouvintes, 'https://app.exemplo.com/quebrada');
    expect(resposta.clone).not.toHaveBeenCalled();
    expect(armazens['economia-hoje-v2']?.size ?? 0).toBe(0);
  });

  test('sem internet: usa a cópia guardada', async () => {
    const guardada = { ok: true, guardada: true };
    const { ouvintes } = carregar({
      fetch: jest.fn().mockRejectedValue(new Error('offline')),
      caches: { 'economia-hoje-v2': new Map([['https://app.exemplo.com/pagina', guardada]]) },
    });
    await expect(pedir(ouvintes, 'https://app.exemplo.com/pagina')).resolves.toBe(guardada);
  });

  test('sem internet e sem cópia da página pedida: abre a página inicial', async () => {
    const inicial = { ok: true, inicial: true };
    const { ouvintes } = carregar({
      fetch: jest.fn().mockRejectedValue(new Error('offline')),
      caches: { 'economia-hoje-v2': new Map([['/', inicial]]) },
    });
    await expect(pedir(ouvintes, 'https://app.exemplo.com/favoritos')).resolves.toBe(inicial);
  });
});
