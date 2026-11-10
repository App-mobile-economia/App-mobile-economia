// Respostas falsas do Banco Central e da CoinGecko, usadas pelos testes das telas.

export function resposta(corpo: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(corpo) });
}

// Responde como as APIs de verdade quando está tudo funcionando.
export function apisFuncionando(url: string) {
  // Busca de moedas pelo nome
  if (url.includes('coingecko') && url.includes('/search')) {
    return resposta({ coins: [{ id: 'cardano', name: 'Cardano', symbol: 'ada' }] });
  }
  // Detalhes das moedas da busca (lista de mercado)
  if (url.includes('coingecko') && url.includes('/coins/markets')) {
    return resposta([
      {
        id: 'cardano',
        name: 'Cardano',
        symbol: 'ada',
        current_price: 2.5,
        price_change_percentage_24h: -1.5,
        market_cap_rank: 9,
        low_24h: 2.1,
        high_24h: 2.9,
        price_change_percentage_7d_in_currency: 5,
        price_change_percentage_30d_in_currency: 10,
        price_change_percentage_1y_in_currency: 50,
      },
    ]);
  }
  // Preços das 6 moedas fixas
  if (url.includes('coingecko')) {
    return resposta({
      bitcoin: { brl: 400000, brl_24h_change: 2.5 },
      ethereum: { brl: 15000, brl_24h_change: -1.2 },
      solana: { brl: 800, brl_24h_change: 0.5 },
      ripple: { brl: 3, brl_24h_change: 1 },
      binancecoin: { brl: 3500, brl_24h_change: 0.1 },
      dogecoin: { brl: 1, brl_24h_change: -3 },
    });
  }
  // Banco Central
  return resposta([{ data: '01/10/2026', valor: '4.50' }, { data: '02/10/2026', valor: '4.60' }]);
}
