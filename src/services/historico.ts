// Histórico dos favoritos em um período (Banco Central e CoinGecko).
import { Meta } from '@/constants/indicadores';
import { formatarPercentual, formatarReais } from '@/utils/formatadores';

export type Periodo = { chave: string; titulo: string; dias: number };

export const PERIODOS: Periodo[] = [
  { chave: '7d', titulo: '7 dias', dias: 7 },
  { chave: '30d', titulo: '30 dias', dias: 30 },
  { chave: '12m', titulo: '12 meses', dias: 365 },
];

// Resumo do período. Moedas não trazem mínimo e máximo (vêm em lote, por causa do limite da CoinGecko).
export type Resumo = { inicio: number; fim: number; minimo?: number; maximo?: number };

// Resultado de um favorito:
// "ok" = tem resumo | "sem-dados" = o período não tem valores | "erro" = a busca falhou.
export type Historico = { status: 'ok' | 'sem-dados' | 'erro'; resumo?: Resumo };

// dd/MM/aaaa, o formato que o Banco Central pede nas datas.
function dataBC(data: Date) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

// ---------- Banco Central ----------

async function valoresBC(serie: number, dias: number): Promise<number[]> {
  const inicio = dataBC(new Date(Date.now() - dias * 86400000));
  const fim = dataBC(new Date());
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados?formato=json&dataInicial=${inicio}&dataFinal=${fim}`;
  const resposta = await fetch(url);
  // Sem valores no período, o Banco Central responde 404 (ou um objeto "erro"): para nós é só "sem dados".
  if (resposta.status === 404) return [];
  if (!resposta.ok) throw new Error(`Banco Central: erro ${resposta.status}`);
  const linhas = await resposta.json();
  if (!Array.isArray(linhas)) return [];
  return linhas.map((linha: { valor: string }) => parseFloat(linha.valor));
}

async function historicoDoBanco(meta: Meta, dias: number): Promise<Historico> {
  if (meta.serie === undefined) return { status: 'sem-dados' };
  try {
    const valores = await valoresBC(meta.serie, dias);
    // IPCA é mensal: em 7 dias não há 2 valores para comparar.
    if (valores.length < 2) return { status: 'sem-dados' };
    const resumo: Resumo = {
      inicio: valores[0],
      fim: valores[valores.length - 1],
      minimo: Math.min(...valores),
      maximo: Math.max(...valores),
    };
    return { status: 'ok', resumo };
  } catch {
    return { status: 'erro' };
  }
}

// ---------- CoinGecko ----------

type MoedaMercado = {
  id: string;
  current_price: number;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  price_change_percentage_1y_in_currency?: number | null;
};

// Escolhe a variação (em %) que combina com o período.
function variacaoDoPeriodo(moeda: MoedaMercado, dias: number) {
  if (dias <= 7) return moeda.price_change_percentage_7d_in_currency;
  if (dias <= 30) return moeda.price_change_percentage_30d_in_currency;
  return moeda.price_change_percentage_1y_in_currency;
}

// Uma chamada só para todas as moedas: a CoinGecko gratuita bloqueia (erro 429)
// quando se pede o histórico de cada moeda separadamente.
async function historicosDeCripto(moedas: Meta[], dias: number): Promise<Record<string, Historico>> {
  const resultado: Record<string, Historico> = {};

  // Sem moedas favoritas, não há o que buscar.
  if (moedas.length === 0) {
    return resultado;
  }

  const ids = moedas.map((m) => m.idCripto).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&price_change_percentage=7d,30d,1y`;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
    const dados: MoedaMercado[] = await resposta.json();

    for (const meta of moedas) {
      const moeda = dados.find((d) => d.id === meta.idCripto);
      const percentual = moeda ? variacaoDoPeriodo(moeda, dias) : null;
      if (moeda && typeof percentual === 'number') {
        // Preço de antes = preço de hoje desfeito da variação.
        const inicio = moeda.current_price / (1 + percentual / 100);
        resultado[meta.chave] = { status: 'ok', resumo: { inicio, fim: moeda.current_price } };
      } else {
        resultado[meta.chave] = { status: 'sem-dados' };
      }
    }
  } catch {
    for (const meta of moedas) {
      resultado[meta.chave] = { status: 'erro' };
    }
  }
  return resultado;
}

// ---------- Todos os favoritos ----------

// Devolve o histórico de cada favorito, guardado pela chave do indicador.
export async function buscarHistoricos(metas: Meta[], dias: number): Promise<Record<string, Historico>> {
  // Separa as moedas (CoinGecko) dos indicadores do Banco Central.
  const moedas: Meta[] = [];
  const doBanco: Meta[] = [];
  for (const meta of metas) {
    if (meta.idCripto !== undefined) {
      moedas.push(meta);
    } else {
      doBanco.push(meta);
    }
  }

  // Começa as duas buscas ao mesmo tempo, para a tela ficar pronta mais rápido.
  const buscaDoBanco = Promise.all(doBanco.map((meta) => historicoDoBanco(meta, dias)));
  const buscaDasMoedas = historicosDeCripto(moedas, dias);

  // Espera as duas terminarem.
  const resultadosDoBanco = await buscaDoBanco;
  const resultadosDasMoedas = await buscaDasMoedas;

  // Junta tudo em um objeto só, pela chave do indicador.
  const resultado: Record<string, Historico> = {};
  for (let i = 0; i < doBanco.length; i++) {
    resultado[doBanco[i].chave] = resultadosDoBanco[i];
  }
  for (const meta of moedas) {
    resultado[meta.chave] = resultadosDasMoedas[meta.chave];
  }
  return resultado;
}

// ---------- Textos ----------

// Mostra o valor como o indicador pede: percentual (taxas) ou reais.
export function formatarValor(meta: Meta, numero: number) {
  return meta.formato === 'percentual' ? formatarPercentual(numero) : formatarReais(numero);
}

// Taxas variam em pontos percentuais; preços variam em %.
export function formatarVariacao(meta: Meta, resumo: Resumo) {
  const diferenca = resumo.fim - resumo.inicio;
  const sinal = diferenca >= 0 ? '+' : '-';
  if (meta.formato === 'percentual') {
    return `${sinal}${Math.abs(diferenca).toFixed(2).replace('.', ',')} p.p.`;
  }
  const percentual = resumo.inicio === 0 ? 0 : (diferenca / resumo.inicio) * 100;
  return `${sinal}${formatarPercentual(Math.abs(percentual))}`;
}
