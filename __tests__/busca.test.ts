import { buscarMoedas, indicadoresDeMoedas, normalizar, PREFIXO_CRIPTO } from '@/services/busca';

function resposta(corpo: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(corpo) });
}

const fetchFalso = jest.fn();
beforeEach(() => {
  fetchFalso.mockReset();
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
});

describe('normalizar', () => {
  test('tira acentos e deixa minúsculo', () => {
    expect(normalizar('Inflação')).toBe('inflacao');
  });

  test('tira espaços das pontas', () => {
    expect(normalizar('  Selic  ')).toBe('selic');
  });

  test('"inflacao" e "Inflação" ficam iguais', () => {
    expect(normalizar('inflacao')).toBe(normalizar('Inflação'));
  });

  test('texto vazio', () => {
    expect(normalizar('')).toBe('');
  });
});

describe('buscarMoedas', () => {
  test('devolve só as 6 primeiras moedas', async () => {
    const moedas = Array.from({ length: 10 }, (_, i) => ({ id: 'm' + i, name: 'Moeda ' + i, symbol: 'm' + i }));
    fetchFalso.mockReturnValue(resposta({ coins: moedas }));
    const achadas = await buscarMoedas('moeda');
    expect(achadas).toHaveLength(6);
    expect(achadas[0].id).toBe('m0');
  });

  test('codifica o texto digitado na URL', async () => {
    fetchFalso.mockReturnValue(resposta({ coins: [] }));
    await buscarMoedas('bit coin&x');
    expect(fetchFalso.mock.calls[0][0]).toBe('https://api.coingecko.com/api/v3/search?query=bit%20coin%26x');
  });

  test('erro da API (429) vira exceção', async () => {
    fetchFalso.mockReturnValue(resposta({}, false, 429));
    await expect(buscarMoedas('sol')).rejects.toThrow('CoinGecko: erro 429');
  });

  test('sem resultados devolve lista vazia', async () => {
    fetchFalso.mockReturnValue(resposta({ coins: [] }));
    await expect(buscarMoedas('zzzz')).resolves.toEqual([]);
  });
});

describe('indicadoresDeMoedas', () => {
  const moedaDeMercado = {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ada',
    current_price: 2.5,
    price_change_percentage_24h: -1.5,
    market_cap_rank: 9,
    low_24h: 2.1,
    high_24h: 2.9,
  };

  test('lista vazia não chama a internet', async () => {
    await expect(indicadoresDeMoedas([])).resolves.toEqual([]);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test('monta o cartão com chave, título, valor, variação e detalhe', async () => {
    fetchFalso.mockReturnValue(resposta([moedaDeMercado]));
    const [cartao] = await indicadoresDeMoedas([{ id: 'cardano', name: 'Cardano', symbol: 'ada' }]);
    expect(cartao.chave).toBe(PREFIXO_CRIPTO + 'cardano');
    expect(cartao.grupo).toBe('Criptomoedas');
    expect(cartao.titulo).toBe('Cardano (ADA)');
    expect(cartao.idCripto).toBe('cardano');
    expect(cartao.variacao).toBe(-1.5);
    expect(cartao.valor.replace(/ /g, ' ')).toBe('R$ 2,50');
    expect(cartao.detalhe?.replace(/ /g, ' ')).toBe('#9 no ranking · Mín R$ 2,10 · Máx R$ 2,90');
  });

  test('sem ranking e sem mín/máx o detalhe fica vazio', async () => {
    fetchFalso.mockReturnValue(
      resposta([{ ...moedaDeMercado, market_cap_rank: null, low_24h: null, high_24h: null }]),
    );
    const [cartao] = await indicadoresDeMoedas([{ id: 'cardano', name: 'Cardano', symbol: 'ada' }]);
    expect(cartao.detalhe).toBe('');
  });

  test('variação nula vira indefinida (cartão não mostra a etiqueta)', async () => {
    fetchFalso.mockReturnValue(resposta([{ ...moedaDeMercado, price_change_percentage_24h: null }]));
    const [cartao] = await indicadoresDeMoedas([{ id: 'cardano', name: 'Cardano', symbol: 'ada' }]);
    expect(cartao.variacao).toBeUndefined();
  });

  test('pede todas as moedas numa chamada só', async () => {
    fetchFalso.mockReturnValue(resposta([]));
    await indicadoresDeMoedas([
      { id: 'a', name: 'A', symbol: 'a' },
      { id: 'b', name: 'B', symbol: 'b' },
    ]);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(fetchFalso.mock.calls[0][0]).toContain('ids=a,b');
  });

  test('erro da API vira exceção', async () => {
    fetchFalso.mockReturnValue(resposta({}, false, 429));
    await expect(indicadoresDeMoedas([{ id: 'a', name: 'A', symbol: 'a' }])).rejects.toThrow('429');
  });
});
