// Busca os dados nas APIs do Banco Central e da CoinGecko.
// Quais indicadores buscar vem da lista em constants/indicadores.ts.
import { INDICADORES, Meta } from '@/constants/indicadores';
import { formatarPercentual, formatarReais } from '@/utils/formatadores';

// Um indicador pronto para aparecer na tela (valor já formatado).
export type Indicador = Meta & { valor: string; detalhe?: string; variacao?: number };

// Série do Banco Central: devolve o último valor publicado.
async function serieBC(codigo: number) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Banco Central: erro ${resposta.status}`);
  const [ultimo] = await resposta.json();
  return { data: ultimo.data as string, valor: parseFloat(ultimo.valor) };
}

// Preço (em reais) e variação de 24h de várias moedas, numa única chamada.
async function criptos(ids: string[]) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=brl&include_24hr_change=true`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  return (await resposta.json()) as Record<string, { brl: number; brl_24h_change: number }>;
}

// Busca tudo ao mesmo tempo. Se uma fonte falhar, as outras continuam funcionando.
export async function buscarTudo(): Promise<Indicador[]> {
  const doBanco = INDICADORES.filter((i) => i.serie !== undefined);
  const moedas = INDICADORES.filter((i) => i.idCripto !== undefined);

  const [series, cripto] = await Promise.all([
    Promise.allSettled(doBanco.map((i) => serieBC(i.serie!))),
    criptos(moedas.map((m) => m.idCripto!)).catch(() => null),
  ]);

  const lista: Indicador[] = [];

  doBanco.forEach((meta, posicao) => {
    const resultado = series[posicao];
    if (resultado.status !== 'fulfilled') return;
    const { data, valor } = resultado.value;
    lista.push({
      ...meta,
      valor: meta.formato === 'reais' ? formatarReais(valor) : formatarPercentual(valor),
      detalhe: `${meta.rotuloData ?? 'Ref.'} ${data}`,
    });
  });

  if (cripto) {
    moedas.forEach((meta) => {
      const dados = cripto[meta.idCripto!];
      if (dados) lista.push({ ...meta, valor: formatarReais(dados.brl), variacao: dados.brl_24h_change });
    });
  }

  return lista;
}
