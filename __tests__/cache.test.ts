import AsyncStorage from '@react-native-async-storage/async-storage';

import { lerCache, salvarCache } from '@/services/cache';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('cache dos indicadores', () => {
  const dados = {
    hora: '10:30',
    lista: [{ chave: 'selic', grupo: 'Economia' as const, titulo: 'Selic', icone: 'business' as const, valor: '10,50%' }],
  };

  test('sem nada salvo devolve null', async () => {
    await expect(lerCache()).resolves.toBeNull();
  });

  test('salva e lê de volta os mesmos dados', async () => {
    await salvarCache(dados);
    await expect(lerCache()).resolves.toEqual(dados);
  });

  test('salvar de novo troca os dados antigos', async () => {
    await salvarCache(dados);
    await salvarCache({ hora: '11:00', lista: [] });
    await expect(lerCache()).resolves.toEqual({ hora: '11:00', lista: [] });
  });

  test('cache corrompido não derruba o app', async () => {
    await AsyncStorage.setItem('ultimos_indicadores', '{texto quebrado');
    await expect(lerCache()).resolves.toBeNull();
  });
});
