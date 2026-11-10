import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import Painel from '@/app/(tabs)/index';
import { apisFuncionando } from '../jest/apis-falsas';

// Largura da tela de teste: cada teste escolhe a sua.
let mockLargura = 400;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockLargura, height: 800, scale: 1, fontScale: 1 }),
}));

jest.mock('@/services/favoritos', () => ({
  listarFavoritos: jest.fn().mockResolvedValue([]),
  adicionarFavorito: jest.fn(),
  removerFavorito: jest.fn(),
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  globalThis.fetch = jest.fn(apisFuncionando) as unknown as typeof fetch;
});

// Quantos elementos da tela têm essa largura no estilo (os cartões).
function contar(largura: string) {
  return screen.container.queryAll((no) => (StyleSheet.flatten(no.props.style) as any)?.width === largura).length;
}

describe('Painel: layout responsivo', () => {
  test('celular: cartões de 2 por linha (48,5%) e título do cartão em linha própria', async () => {
    mockLargura = 400;
    await render(<Painel />);
    await screen.findByText('IPCA do mês');
    expect(contar('48.5%')).toBeGreaterThan(0);
    expect(contar('24%')).toBe(0);
  });

  test('computador: Economia em 4 colunas (24%) e criptomoedas em 2 (49%)', async () => {
    mockLargura = 1200;
    await render(<Painel />);
    await screen.findByText('IPCA do mês');
    expect(contar('24%')).toBeGreaterThan(0);
    expect(contar('49%')).toBeGreaterThan(0);
    expect(contar('48.5%')).toBe(0);
  });

  test('exatamente 900 px já conta como computador', async () => {
    mockLargura = 900;
    await render(<Painel />);
    await screen.findByText('IPCA do mês');
    expect(contar('24%')).toBeGreaterThan(0);
  });

  test('celular: resultado da busca de moedas ocupa a linha toda (100%)', async () => {
    mockLargura = 400;
    await render(<Painel />);
    await screen.findByText('IPCA do mês');
    const antes = contar('100%'); // outros elementos da tela já têm 100%
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'cardano');
    await screen.findByText('Outras criptomoedas', {}, { timeout: 3000 });
    expect(contar('100%')).toBeGreaterThan(antes);
  });

  test('computador: resultado da busca de moedas usa 49%', async () => {
    mockLargura = 1200;
    await render(<Painel />);
    await screen.findByText('IPCA do mês');
    const antesCem = contar('100%');
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'cardano');
    await screen.findByText('Outras criptomoedas', {}, { timeout: 3000 });
    // Os cartões fixos saem do filtro; sobra o da moeda achada, com 49%.
    expect(contar('49%')).toBe(1);
    expect(contar('100%')).toBe(antesCem);
  });
});
