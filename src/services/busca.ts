// Busca de criptomoedas por nome na CoinGecko.
import { Meta } from '@/constants/indicadores';
import { Indicador } from '@/services/api';
import { formatarReais } from '@/utils/formatadores';

// Prefixo da chave dos favoritos de moedas que vieram da busca (ex.: "cripto:solana").
export const PREFIXO_CRIPTO = 'cripto:';

type Moeda = { id: string; name: string; symbol: string };

// Moedas que combinam com o texto digitado (as mais conhecidas primeiro).
export async function buscarMoedas(texto: string): Promise<Moeda[]> {
  const resposta = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(texto)}`);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  const dados: { coins: Moeda[] } = await resposta.json();
  return dados.coins.slice(0, 6);
}

// Dados completos das moedas achadas, numa chamada só. Vira a mesma estrutura dos cartões do Painel.
export async function indicadoresDeMoedas(moedas: Moeda[]): Promise<Indicador[]> {
  if (moedas.length === 0) return [];
  const ids = moedas.map((m) => m.id).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&price_change_percentage=24h`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  const dados: {
    id: string;
    name: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number | null;
    market_cap_rank: number | null;
    low_24h: number | null;
    high_24h: number | null;
  }[] = await resposta.json();

  return dados.map((d) => {
    const meta: Meta = {
      chave: PREFIXO_CRIPTO + d.id,
      grupo: 'Criptomoedas',
      titulo: `${d.name} (${d.symbol.toUpperCase()})`,
      icone: 'cash',
      idCripto: d.id,
    };
    const faixa =
      d.low_24h !== null && d.high_24h !== null
        ? `Mín ${formatarReais(d.low_24h)} · Máx ${formatarReais(d.high_24h)}`
        : undefined;
    return {
      ...meta,
      valor: formatarReais(d.current_price),
      variacao: d.price_change_percentage_24h ?? undefined,
      detalhe: [d.market_cap_rank ? `#${d.market_cap_rank} no ranking` : null, faixa].filter(Boolean).join(' · '),
    };
  });
}

// Tira acentos e maiúsculas, para "inflacao" achar "Inflação".
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
