// Guarda a última lista de indicadores no aparelho, para o modo offline.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Indicador } from '@/services/api';

const CHAVE = 'ultimos_indicadores';

export type Salvo = { hora: string; lista: Indicador[] };

export async function salvarCache(dados: Salvo) {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(dados));
}

export async function lerCache(): Promise<Salvo | null> {
  const texto = await AsyncStorage.getItem(CHAVE);
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    // Cache gravado pela metade: apaga e segue como se não existisse.
    await AsyncStorage.removeItem(CHAVE);
    return null;
  }
}
