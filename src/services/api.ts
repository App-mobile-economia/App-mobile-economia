// Busca os valores atuais nas APIs do Banco Central e da CoinGecko.
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
  const lista = await resposta.json();
  const ultimo = lista[0];
  return { data: ultimo.data as string, valor: parseFloat(ultimo.valor) };
}

// Monta um indicador do Banco Central. Se der erro, devolve null (os outros continuam funcionando).
async function indicadorDoBanco(meta: Meta): Promise<Indicador | null> {
  if (meta.serie === undefined) return null;
  try {
    const { data, valor } = await serieBC(meta.serie);
    return {
      ...meta,
      valor: meta.formato === 'reais' ? formatarReais(valor) : formatarPercentual(valor),
      detalhe: `${meta.rotuloData ?? 'Ref.'} ${data}`,
    };
  } catch {
    return null;
  }
}

// Preço (em reais) e variação de 24h de várias moedas, numa única chamada.
async function indicadoresDeCripto(moedas: Meta[]): Promise<Indicador[]> {
  const ids = moedas.map((m) => m.idCripto).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`;
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
    const precos = await resposta.json();

    const lista: Indicador[] = [];
    for (const meta of moedas) {
      const dados = precos[meta.idCripto ?? ''];
      if (dados) {
        lista.push({ ...meta, valor: formatarReais(dados.brl), variacao: dados.brl_24h_change });
      }
    }
    return lista;
  } catch {
    return [];
  }
}

// Busca tudo ao mesmo tempo. Se uma fonte falhar, as outras continuam funcionando.
export async function buscarTudo(): Promise<Indicador[]> {
  const doBanco = INDICADORES.filter((i) => i.serie !== undefined);
  const moedas = INDICADORES.filter((i) => i.idCripto !== undefined);

  const [resultadosBanco, resultadosCripto] = await Promise.all([
    Promise.all(doBanco.map(indicadorDoBanco)),
    indicadoresDeCripto(moedas),
  ]);

  const lista: Indicador[] = [];
  for (const item of resultadosBanco) {
    if (item) lista.push(item);
  }
  return [...lista, ...resultadosCripto];
}
