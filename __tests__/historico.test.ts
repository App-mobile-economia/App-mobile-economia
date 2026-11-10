import { metaDaChave } from '@/constants/indicadores';
import { buscarHistoricos, formatarValor, formatarVariacao, PERIODOS } from '@/services/historico';

function resposta(corpo: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(corpo) });
}

const fetchFalso = jest.fn();
beforeEach(() => {
  fetchFalso.mockReset();
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
});

const dolar = metaDaChave('dolar'); // Banco Central, em reais
const selic = metaDaChave('selic'); // Banco Central, percentual
const bitcoin = metaDaChave('bitcoin'); // CoinGecko
const ethereum = metaDaChave('ethereum');

describe('PERIODOS', () => {
  test('7 dias, 30 dias e 12 meses', () => {
    expect(PERIODOS.map((p) => p.dias)).toEqual([7, 30, 365]);
    expect(PERIODOS.map((p) => p.chave)).toEqual(['7d', '30d', '12m']);
  });
});

describe('buscarHistoricos - Banco Central', () => {
  test('calcula início, fim, mínimo e máximo', async () => {
    fetchFalso.mockReturnValue(
      resposta([{ valor: '5.0' }, { valor: '4.0' }, { valor: '6.0' }, { valor: '5.5' }]),
    );
    const r = await buscarHistoricos([dolar], 30);
    expect(r.dolar.status).toBe('ok');
    expect(r.dolar.resumo).toEqual({ inicio: 5, fim: 5.5, minimo: 4, maximo: 6 });
  });

  test('envia as datas no formato dd/MM/aaaa', async () => {
    fetchFalso.mockReturnValue(resposta([]));
    await buscarHistoricos([dolar], 7);
    const url: string = fetchFalso.mock.calls[0][0];
    expect(url).toMatch(/dataInicial=\d{2}\/\d{2}\/\d{4}&dataFinal=\d{2}\/\d{2}\/\d{4}/);
  });

  test('404 (período sem valores) vira "sem-dados"', async () => {
    fetchFalso.mockReturnValue(resposta({}, false, 404));
    const r = await buscarHistoricos([selic], 7);
    expect(r.selic.status).toBe('sem-dados');
  });

  test('resposta {"erro":...} vira "sem-dados"', async () => {
    fetchFalso.mockReturnValue(resposta({ erro: 'sem dados' }));
    const r = await buscarHistoricos([selic], 7);
    expect(r.selic.status).toBe('sem-dados');
  });

  test('só um valor no período vira "sem-dados" (não dá para comparar)', async () => {
    fetchFalso.mockReturnValue(resposta([{ valor: '4.5' }]));
    const r = await buscarHistoricos([selic], 7);
    expect(r.selic.status).toBe('sem-dados');
  });

  test('erro 500 vira "erro"', async () => {
    fetchFalso.mockReturnValue(resposta([], false, 500));
    const r = await buscarHistoricos([selic], 30);
    expect(r.selic.status).toBe('erro');
  });

  test('sem internet vira "erro", sem estourar exceção', async () => {
    fetchFalso.mockRejectedValue(new Error('Network request failed'));
    const r = await buscarHistoricos([selic], 30);
    expect(r.selic.status).toBe('erro');
  });

  test('uma série com erro não atrapalha as outras', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('sgs.432/') ? resposta([], false, 500) : resposta([{ valor: '1' }, { valor: '2' }]),
    );
    const r = await buscarHistoricos([selic, dolar], 30);
    expect(r.selic.status).toBe('erro');
    expect(r.dolar.status).toBe('ok');
  });
});

describe('buscarHistoricos - CoinGecko', () => {
  const mercado = [
    {
      id: 'bitcoin',
      current_price: 110,
      price_change_percentage_7d_in_currency: 10,
      price_change_percentage_30d_in_currency: 20,
      price_change_percentage_1y_in_currency: 100,
    },
    { id: 'ethereum', current_price: 50 },
  ];

  test('7 dias usa a variação de 7 dias e desfaz o percentual para achar o preço inicial', async () => {
    fetchFalso.mockReturnValue(resposta(mercado));
    const r = await buscarHistoricos([bitcoin], 7);
    expect(r.bitcoin.status).toBe('ok');
    expect(r.bitcoin.resumo?.fim).toBe(110);
    expect(r.bitcoin.resumo?.inicio).toBeCloseTo(100, 5);
  });

  test('30 dias usa a variação de 30 dias', async () => {
    fetchFalso.mockReturnValue(resposta(mercado));
    const r = await buscarHistoricos([bitcoin], 30);
    expect(r.bitcoin.resumo?.inicio).toBeCloseTo(110 / 1.2, 5);
  });

  test('12 meses usa a variação de 1 ano', async () => {
    fetchFalso.mockReturnValue(resposta(mercado));
    const r = await buscarHistoricos([bitcoin], 365);
    expect(r.bitcoin.resumo?.inicio).toBeCloseTo(55, 5);
  });

  test('moeda sem a variação do período vira "sem-dados"', async () => {
    fetchFalso.mockReturnValue(resposta(mercado));
    const r = await buscarHistoricos([ethereum], 30);
    expect(r.ethereum.status).toBe('sem-dados');
  });

  test('moeda que a API não devolveu vira "sem-dados"', async () => {
    fetchFalso.mockReturnValue(resposta([]));
    const r = await buscarHistoricos([bitcoin], 30);
    expect(r.bitcoin.status).toBe('sem-dados');
  });

  test('várias moedas usam uma chamada só (evita o limite 429)', async () => {
    fetchFalso.mockReturnValue(resposta(mercado));
    await buscarHistoricos([bitcoin, ethereum], 30);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(fetchFalso.mock.calls[0][0]).toContain('ids=bitcoin,ethereum');
  });

  test('erro 429 marca todas as moedas como "erro"', async () => {
    fetchFalso.mockReturnValue(resposta({}, false, 429));
    const r = await buscarHistoricos([bitcoin, ethereum], 30);
    expect(r.bitcoin.status).toBe('erro');
    expect(r.ethereum.status).toBe('erro');
  });

  test('sem moedas favoritas não chama a CoinGecko', async () => {
    fetchFalso.mockReturnValue(resposta([{ valor: '1' }, { valor: '2' }]));
    await buscarHistoricos([dolar], 30);
    const urls: string[] = fetchFalso.mock.calls.map((c) => c[0]);
    expect(urls.some((u) => u.includes('coingecko'))).toBe(false);
  });

  test('mistura Banco Central e moedas no mesmo resultado', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('coingecko') ? resposta(mercado) : resposta([{ valor: '1' }, { valor: '2' }]),
    );
    const r = await buscarHistoricos([dolar, bitcoin], 30);
    expect(Object.keys(r).sort()).toEqual(['bitcoin', 'dolar']);
  });

  test('moeda vinda da busca ("cripto:id") também funciona', async () => {
    fetchFalso.mockReturnValue(
      resposta([{ id: 'cardano', current_price: 3, price_change_percentage_30d_in_currency: 50 }]),
    );
    const r = await buscarHistoricos([metaDaChave('cripto:cardano')], 30);
    expect(r['cripto:cardano'].status).toBe('ok');
  });
});

describe('formatarValor e formatarVariacao', () => {
  test('taxa (percentual) é mostrada em %', () => {
    expect(formatarValor(selic, 10.5)).toBe('10,50%');
  });

  test('preço é mostrado em reais', () => {
    expect(formatarValor(dolar, 5).replace(/ /g, ' ')).toBe('R$ 5,00');
  });

  test('taxa que sobe mostra pontos percentuais com sinal +', () => {
    expect(formatarVariacao(selic, { inicio: 10, fim: 10.75 })).toBe('+0,75 p.p.');
  });

  test('taxa que cai mostra sinal -', () => {
    expect(formatarVariacao(selic, { inicio: 10.75, fim: 10 })).toBe('-0,75 p.p.');
  });

  test('preço que sobe 10% mostra +10,00%', () => {
    expect(formatarVariacao(dolar, { inicio: 100, fim: 110 })).toBe('+10,00%');
  });

  test('preço que cai 50% mostra -50,00%', () => {
    expect(formatarVariacao(dolar, { inicio: 100, fim: 50 })).toBe('-50,00%');
  });

  test('início zero não divide por zero', () => {
    expect(formatarVariacao(dolar, { inicio: 0, fim: 5 })).toBe('+0,00%');
  });
});
