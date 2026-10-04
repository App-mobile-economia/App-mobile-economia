// Tudo que fala com a CoinGecko fica aqui.

export type Cripto = { brl: number; brl_24h_change: number };
export type Criptos = { bitcoin: Cripto; ethereum: Cripto };

export async function buscarCripto(): Promise<Criptos> {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true';
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`CoinGecko: HTTP ${resposta.status}`);
  return await resposta.json();
}
