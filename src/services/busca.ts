// Busca de criptomoedas por nome na CoinGecko.
import { Meta } from '@/constants/indicadores';
import { Indicador } from '@/services/api';
import { formatarReais } from '@/utils/formatadores';

// Prefixo da chave dos favoritos de moedas que vieram da busca (ex.: "cripto:solana").
export const PREFIXO_CRIPTO = 'cripto:';

// Uma moeda como a busca devolve.
type MoedaDaBusca = { id: string; name: string; symbol: string };

// Moedas que combinam com o texto digitado (as mais conhecidas primeiro). Devolve só as 6 primeiras.
export async function buscarMoedas(texto: string): Promise<MoedaDaBusca[]> {
  const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(texto)}`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  const dados: { coins: MoedaDaBusca[] } = await resposta.json();
  return dados.coins.slice(0, 6);
}

// Uma moeda como a lista de mercado devolve (preço, ranking, mínimo e máximo de 24h).
type MoedaDeMercado = {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap_rank: number | null;
  low_24h: number | null;
  high_24h: number | null;
};

// Monta o texto de detalhe do cartão: ranking e faixa de preço do dia.
function montarDetalhe(moeda: MoedaDeMercado) {
  const partes: string[] = [];
  if (moeda.market_cap_rank) {
    partes.push(`#${moeda.market_cap_rank} no ranking`);
  }
  if (moeda.low_24h !== null && moeda.high_24h !== null) {
    partes.push(`Mín ${formatarReais(moeda.low_24h)} · Máx ${formatarReais(moeda.high_24h)}`);
  }
  return partes.join(' · ');
}

// Busca os dados das moedas achadas, numa chamada só, e monta os mesmos cartões do Painel.
export async function indicadoresDeMoedas(moedas: MoedaDaBusca[]): Promise<Indicador[]> {
  if (moedas.length === 0) return [];

  const ids = moedas.map((m) => m.id).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&price_change_percentage=24h`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  const dados: MoedaDeMercado[] = await resposta.json();

  const lista: Indicador[] = [];
  for (const moeda of dados) {
    const meta: Meta = {
      chave: PREFIXO_CRIPTO + moeda.id,
      grupo: 'Criptomoedas',
      titulo: `${moeda.name} (${moeda.symbol.toUpperCase()})`,
      icone: 'cash',
      idCripto: moeda.id,
    };
    lista.push({
      ...meta,
      valor: formatarReais(moeda.current_price),
      variacao: moeda.price_change_percentage_24h ?? undefined,
      detalhe: montarDetalhe(moeda),
    });
  }
  return lista;
}

// Tira acentos e maiúsculas, para "inflacao" achar "Inflação".
export function normalizar(texto: string) {
  const semAcentos = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return semAcentos.toLowerCase().trim();
}
