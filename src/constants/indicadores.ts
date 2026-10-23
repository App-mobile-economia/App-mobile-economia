import { Ionicons } from '@expo/vector-icons';

export type Meta = {
  chave: string; // identifica o indicador (também é salvo nos favoritos)
  grupo: 'Economia' | 'Criptomoedas';
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  // Indicadores do Banco Central: número da série e como mostrar o valor.
  serie?: number;
  formato?: 'percentual' | 'reais';
  rotuloData?: string; // texto antes da data (padrão: "Ref.")
  // Criptomoedas: id da moeda na CoinGecko.
  idCripto?: string;
};

// Ordem em que os cartões aparecem na tela.
// Para incluir um indicador novo, basta adicionar uma linha aqui.
export const INDICADORES: Meta[] = [
  { chave: 'ipca', grupo: 'Economia', titulo: 'IPCA do mês', icone: 'pricetag', serie: 433, formato: 'percentual' },
  { chave: 'ipca12m', grupo: 'Economia', titulo: 'IPCA 12 meses', icone: 'calendar', serie: 13522, formato: 'percentual' },
  { chave: 'inpc', grupo: 'Economia', titulo: 'INPC do mês', icone: 'cart', serie: 188, formato: 'percentual' },
  { chave: 'igpm', grupo: 'Economia', titulo: 'IGP-M do mês', icone: 'trending-up', serie: 189, formato: 'percentual' },
  { chave: 'selic', grupo: 'Economia', titulo: 'Selic (meta)', icone: 'business', serie: 432, formato: 'percentual', rotuloData: 'Desde' },
  { chave: 'cdi', grupo: 'Economia', titulo: 'CDI (ao ano)', icone: 'wallet', serie: 4389, formato: 'percentual', rotuloData: 'Em' },
  { chave: 'dolar', grupo: 'Economia', titulo: 'Dólar (venda)', icone: 'cash', serie: 1, formato: 'reais', rotuloData: 'Em' },
  { chave: 'euro', grupo: 'Economia', titulo: 'Euro (venda)', icone: 'logo-euro', serie: 21619, formato: 'reais', rotuloData: 'Em' },
  { chave: 'desemprego', grupo: 'Economia', titulo: 'Desemprego', icone: 'people', serie: 24369, formato: 'percentual' },
  { chave: 'bitcoin', grupo: 'Criptomoedas', titulo: 'Bitcoin (BTC)', icone: 'logo-bitcoin', idCripto: 'bitcoin' },
  { chave: 'ethereum', grupo: 'Criptomoedas', titulo: 'Ethereum (ETH)', icone: 'diamond', idCripto: 'ethereum' },
  { chave: 'solana', grupo: 'Criptomoedas', titulo: 'Solana (SOL)', icone: 'flash', idCripto: 'solana' },
  { chave: 'ripple', grupo: 'Criptomoedas', titulo: 'XRP (XRP)', icone: 'water', idCripto: 'ripple' },
  { chave: 'binancecoin', grupo: 'Criptomoedas', titulo: 'BNB (BNB)', icone: 'cube', idCripto: 'binancecoin' },
  { chave: 'dogecoin', grupo: 'Criptomoedas', titulo: 'Dogecoin (DOGE)', icone: 'paw', idCripto: 'dogecoin' },
];
