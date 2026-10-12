import { Ionicons } from '@expo/vector-icons';

export type Meta = {
  chave: string; // identifica o indicador (também é salvo nos favoritos)
  grupo: 'Economia' | 'Criptomoedas';
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
};

// Ordem em que os cartões aparecem na tela.
export const INDICADORES: Meta[] = [
  { chave: 'ipca', grupo: 'Economia', titulo: 'IPCA do mês', icone: 'pricetag' },
  { chave: 'ipca12m', grupo: 'Economia', titulo: 'IPCA 12 meses', icone: 'calendar' },
  { chave: 'selic', grupo: 'Economia', titulo: 'Selic (meta)', icone: 'business' },
  { chave: 'dolar', grupo: 'Economia', titulo: 'Dólar (venda)', icone: 'cash' },
  { chave: 'bitcoin', grupo: 'Criptomoedas', titulo: 'Bitcoin (BTC)', icone: 'logo-bitcoin' },
  { chave: 'ethereum', grupo: 'Criptomoedas', titulo: 'Ethereum (ETH)', icone: 'diamond' },
];
