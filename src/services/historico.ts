// Histórico de um indicador em um período (Banco Central ou CoinGecko).
import { Meta } from '@/constants/indicadores';
import { formatarPercentual, formatarReais } from '@/utils/formatadores';

export type Periodo = { chave: string; titulo: string; dias: number };

export const PERIODOS: Periodo[] = [
  { chave: '7d', titulo: '7 dias', dias: 7 },
  { chave: '30d', titulo: '30 dias', dias: 30 },
  { chave: '12m', titulo: '12 meses', dias: 365 },
];

export type Resumo = { inicio: number; fim: number; minimo: number; maximo: number };

// dd/MM/aaaa, o formato que o Banco Central pede nas datas.
function dataBC(data: Date) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

async function valoresBC(serie: number, dias: number): Promise<number[]> {
  const inicio = dataBC(new Date(Date.now() - dias * 86400000));
  const fim = dataBC(new Date());
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${inicio}&dataFinal=${fim}`;
  const resposta = await fetch(url);
  // Sem valores no período, o Banco Central responde 404 (ou um objeto "erro"): para nós é só "sem dados".
  if (resposta.status === 404) return [];
  if (!resposta.ok) throw new Error(`Banco Central: erro ${resposta.status}`);
  const linhas = await resposta.json();
  return Array.isArray(linhas) ? linhas.map((l: { valor: string }) => parseFloat(l.valor)) : [];
}

async function valoresCripto(id: string, dias: number): Promise<number[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=brl&days=${dias}`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  const dados: { prices: [number, number][] } = await resposta.json();
  return dados.prices.map(([, preco]) => preco);
}

// Devolve null quando o período tem menos de 2 pontos (ex.: IPCA é mensal, então 7 dias não tem dados).
export async function buscarResumo(meta: Meta, dias: number): Promise<Resumo | null> {
  let valores: number[] = [];
  if (meta.serie !== undefined) valores = await valoresBC(meta.serie, dias);
  else if (meta.idCripto) valores = await valoresCripto(meta.idCripto, dias);

  if (valores.length < 2) return null;
  return {
    inicio: valores[0],
    fim: valores[valores.length - 1],
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
  };
}

// Mostra o valor como o indicador pede: percentual (taxas) ou reais.
export function formatarValor(meta: Meta, numero: number) {
  return meta.formato === 'percentual' ? formatarPercentual(numero) : formatarReais(numero);
}

// Taxas variam em pontos percentuais; preços variam em %.
export function formatarVariacao(meta: Meta, resumo: Resumo) {
  const diferenca = resumo.fim - resumo.inicio;
  const sinal = diferenca >= 0 ? '+' : '-';
  if (meta.formato === 'percentual') return `${sinal}${Math.abs(diferenca).toFixed(2).replace('.', ',')} p.p.`;
  const percentual = resumo.inicio === 0 ? 0 : (diferenca / resumo.inicio) * 100;
  return `${sinal}${formatarPercentual(Math.abs(percentual))}`;
}
