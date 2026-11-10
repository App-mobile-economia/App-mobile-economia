import { INDICADORES } from '@/constants/indicadores';
import { buscarTudo } from '@/services/api';

// Resposta falsa do fetch.
function resposta(corpo: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(corpo) });
}

const fetchFalso = jest.fn();
beforeEach(() => {
  fetchFalso.mockReset();
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
});

// Responde como as APIs de verdade: Banco Central devolve [{data, valor}], CoinGecko devolve preços.
function apisFuncionando(url: string) {
  if (url.includes('api.bcb.gov.br')) {
    return resposta([{ data: '01/10/2026', valor: '4.50' }]);
  }
  return resposta({
    bitcoin: { brl: 400000, brl_24h_change: 2.5 },
    ethereum: { brl: 15000, brl_24h_change: -1.2 },
    solana: { brl: 800, brl_24h_change: 0.5 },
    ripple: { brl: 3, brl_24h_change: 1 },
    binancecoin: { brl: 3500, brl_24h_change: 0.1 },
    dogecoin: { brl: 1, brl_24h_change: -3 },
  });
}

describe('buscarTudo', () => {
  test('devolve os 15 indicadores quando as duas APIs funcionam', async () => {
    fetchFalso.mockImplementation(apisFuncionando);
    const lista = await buscarTudo();
    expect(lista).toHaveLength(INDICADORES.length);
  });

  test('chama o Banco Central uma vez por indicador e a CoinGecko uma vez só', async () => {
    fetchFalso.mockImplementation(apisFuncionando);
    await buscarTudo();
    const urls: string[] = fetchFalso.mock.calls.map((c) => c[0]);
    expect(urls.filter((u) => u.includes('api.bcb.gov.br'))).toHaveLength(9);
    expect(urls.filter((u) => u.includes('api.coingecko.com'))).toHaveLength(1);
  });

  test('usa o número da série de cada indicador do Banco Central', async () => {
    fetchFalso.mockImplementation(apisFuncionando);
    await buscarTudo();
    const urls: string[] = fetchFalso.mock.calls.map((c) => c[0]);
    expect(urls.some((u) => u.includes('bcdata.sgs.432/'))).toBe(true); // Selic
    expect(urls.some((u) => u.includes('bcdata.sgs.433/'))).toBe(true); // IPCA
  });

  test('formata percentual, reais e a data de referência', async () => {
    fetchFalso.mockImplementation(apisFuncionando);
    const lista = await buscarTudo();
    const selic = lista.find((i) => i.chave === 'selic');
    expect(selic?.valor).toBe('4,50%');
    expect(selic?.detalhe).toBe('Desde 01/10/2026');
    const ipca = lista.find((i) => i.chave === 'ipca');
    expect(ipca?.detalhe).toBe('Ref. 01/10/2026');
    const dolar = lista.find((i) => i.chave === 'dolar');
    expect(dolar?.valor.replace(/ /g, ' ')).toBe('R$ 4,50');
  });

  test('criptomoedas trazem a variação de 24h', async () => {
    fetchFalso.mockImplementation(apisFuncionando);
    const lista = await buscarTudo();
    const bitcoin = lista.find((i) => i.chave === 'bitcoin');
    expect(bitcoin?.variacao).toBe(2.5);
    const ethereum = lista.find((i) => i.chave === 'ethereum');
    expect(ethereum?.variacao).toBe(-1.2);
  });

  test('se a CoinGecko falhar (429), os indicadores do Banco Central continuam', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('coingecko') ? resposta({}, false, 429) : apisFuncionando(url),
    );
    const lista = await buscarTudo();
    expect(lista).toHaveLength(9);
    expect(lista.every((i) => i.grupo === 'Economia')).toBe(true);
  });

  test('se o Banco Central cair, as criptomoedas continuam', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('bcb.gov.br') ? resposta([], false, 500) : apisFuncionando(url),
    );
    const lista = await buscarTudo();
    expect(lista).toHaveLength(6);
    expect(lista.every((i) => i.grupo === 'Criptomoedas')).toBe(true);
  });

  test('se uma série do Banco Central falhar, só ela some', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('bcdata.sgs.432/') ? resposta([], false, 500) : apisFuncionando(url),
    );
    const lista = await buscarTudo();
    expect(lista).toHaveLength(14);
    expect(lista.find((i) => i.chave === 'selic')).toBeUndefined();
  });

  test('sem internet (fetch rejeitado) devolve lista vazia, sem erro', async () => {
    fetchFalso.mockRejectedValue(new Error('Network request failed'));
    await expect(buscarTudo()).resolves.toEqual([]);
  });

  test('série do Banco Central vazia não derruba a busca', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('bcb.gov.br') ? resposta([]) : apisFuncionando(url),
    );
    const lista = await buscarTudo();
    expect(lista.filter((i) => i.grupo === 'Criptomoedas')).toHaveLength(6);
  });

  test('moeda que a CoinGecko não devolveu fica de fora', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('coingecko') ? resposta({ bitcoin: { brl: 1, brl_24h_change: 0 } }) : apisFuncionando(url),
    );
    const lista = await buscarTudo();
    expect(lista.filter((i) => i.grupo === 'Criptomoedas')).toHaveLength(1);
  });
});
