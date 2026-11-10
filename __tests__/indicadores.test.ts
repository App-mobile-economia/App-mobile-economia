import { FILTROS_GRUPO, INDICADORES, metaDaChave } from '@/constants/indicadores';

describe('lista de indicadores', () => {
  test('tem 15 indicadores: 9 de Economia e 6 de Criptomoedas', () => {
    expect(INDICADORES).toHaveLength(15);
    expect(INDICADORES.filter((i) => i.grupo === 'Economia')).toHaveLength(9);
    expect(INDICADORES.filter((i) => i.grupo === 'Criptomoedas')).toHaveLength(6);
  });

  test('as chaves não se repetem', () => {
    const chaves = INDICADORES.map((i) => i.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  test('todo indicador de Economia tem série do Banco Central e formato', () => {
    for (const indicador of INDICADORES.filter((i) => i.grupo === 'Economia')) {
      expect(typeof indicador.serie).toBe('number');
      expect(['percentual', 'reais']).toContain(indicador.formato);
    }
  });

  test('toda criptomoeda tem o id da CoinGecko', () => {
    for (const indicador of INDICADORES.filter((i) => i.grupo === 'Criptomoedas')) {
      expect(typeof indicador.idCripto).toBe('string');
      expect(indicador.idCripto).not.toBe('');
    }
  });

  test('os filtros são Todos, Economia e Criptomoedas', () => {
    expect(FILTROS_GRUPO).toEqual(['Todos', 'Economia', 'Criptomoedas']);
  });
});

describe('metaDaChave', () => {
  test('acha um indicador fixo pela chave', () => {
    expect(metaDaChave('selic').titulo).toBe('Selic (meta)');
  });

  test('moeda da busca ("cripto:id") vira uma criptomoeda', () => {
    const meta = metaDaChave('cripto:cardano');
    expect(meta.grupo).toBe('Criptomoedas');
    expect(meta.idCripto).toBe('cardano');
    expect(meta.titulo).toBe('Cardano');
  });

  test('chave de moeda fixa não é tratada como moeda da busca', () => {
    expect(metaDaChave('bitcoin').titulo).toBe('Bitcoin (BTC)');
  });
});
