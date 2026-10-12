// Busca os dados nas APIs do Banco Central e da CoinGecko.
import { INDICADORES, Meta } from '@/constants/indicadores';
import { formatarPercentual, formatarReais } from '@/utils/formatadores';

// Um indicador pronto para aparecer na tela (valor já formatado).
export type Indicador = Meta & { valor: string; detalhe?: string; variacao?: number };

const meta = (chave: string) => INDICADORES.find((i) => i.chave === chave)!;

// Série do Banco Central: devolve o último valor publicado.
async function serieBC(codigo: number) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Banco Central: erro ${resposta.status}`);
  const [ultimo] = await resposta.json();
  return { data: ultimo.data as string, valor: parseFloat(ultimo.valor) };
}

async function criptos() {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true';
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: erro ${resposta.status}`);
  return await resposta.json();
}

// Busca tudo ao mesmo tempo. Se uma fonte falhar, as outras continuam funcionando.
export async function buscarTudo(): Promise<Indicador[]> {
  const [ipca, ipca12m, selic, dolar, cripto] = await Promise.allSettled([
    serieBC(433),
    serieBC(13522),
    serieBC(432),
    serieBC(1),
    criptos(),
  ]);

  const lista: Indicador[] = [];
  if (ipca.status === 'fulfilled')
    lista.push({ ...meta('ipca'), valor: formatarPercentual(ipca.value.valor), detalhe: `Ref. ${ipca.value.data}` });
  if (ipca12m.status === 'fulfilled')
    lista.push({ ...meta('ipca12m'), valor: formatarPercentual(ipca12m.value.valor), detalhe: `Ref. ${ipca12m.value.data}` });
  if (selic.status === 'fulfilled')
    lista.push({ ...meta('selic'), valor: formatarPercentual(selic.value.valor), detalhe: `Desde ${selic.value.data}` });
  if (dolar.status === 'fulfilled')
    lista.push({ ...meta('dolar'), valor: formatarReais(dolar.value.valor), detalhe: `Em ${dolar.value.data}` });
  if (cripto.status === 'fulfilled') {
    const { bitcoin, ethereum } = cripto.value;
    lista.push({ ...meta('bitcoin'), valor: formatarReais(bitcoin.brl), variacao: bitcoin.brl_24h_change });
    lista.push({ ...meta('ethereum'), valor: formatarReais(ethereum.brl), variacao: ethereum.brl_24h_change });
  }
  return lista;
}
