// Tudo que fala com a CoinGecko fica aqui.

export async function buscarCripto() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true";
  const resposta = await fetch(url);
  return await resposta.json();
}
