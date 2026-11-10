import { render } from '@testing-library/react-native';

import AbasLayout from '@/app/(tabs)/_layout';
import { cores, LARGURA_DESKTOP } from '@/constants/cores';

// Navegação de teste: só guarda as opções recebidas.
let mockOpcoes: any = null;
let mockTelas: { name: string; options: any }[] = [];
jest.mock('expo-router', () => {
  const Tabs = ({ screenOptions, children }: any) => {
    mockOpcoes = screenOptions;
    return children;
  };
  Tabs.Screen = ({ name, options }: any) => {
    mockTelas.push({ name, options });
    return null;
  };
  return { Tabs };
});

// Largura da tela de teste: cada teste escolhe a sua.
let mockLargura = 400;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockLargura, height: 800, scale: 1, fontScale: 1 }),
}));

function larguraDaTela(largura: number) {
  mockLargura = largura;
}

beforeEach(() => {
  mockOpcoes = null;
  mockTelas = [];
});

describe('abas do app', () => {
  test('tem três abas: Painel, Favoritos e Perfil, nessa ordem', async () => {
    larguraDaTela(400);
    await render(<AbasLayout />);
    expect(mockTelas.map((t) => t.name)).toEqual(['index', 'favoritos', 'perfil']);
    expect(mockTelas.map((t) => t.options.title)).toEqual(['Painel', 'Favoritos', 'Perfil']);
  });

  test('celular: abas embaixo', async () => {
    larguraDaTela(LARGURA_DESKTOP - 1);
    await render(<AbasLayout />);
    expect(mockOpcoes.tabBarPosition).toBe('bottom');
  });

  test('computador (900 px ou mais): abas na lateral esquerda', async () => {
    larguraDaTela(LARGURA_DESKTOP);
    await render(<AbasLayout />);
    expect(mockOpcoes.tabBarPosition).toBe('left');
  });

  test('sem cabeçalho e com as cores do tema', async () => {
    larguraDaTela(400);
    await render(<AbasLayout />);
    expect(mockOpcoes.headerShown).toBe(false);
    expect(mockOpcoes.tabBarActiveTintColor).toBe(cores.destaque);
    expect(mockOpcoes.tabBarInactiveTintColor).toBe(cores.textoSecundario);
  });

  test('cada aba tem seu ícone', async () => {
    larguraDaTela(400);
    await render(<AbasLayout />);
    const nomes = mockTelas.map((t) => t.options.tabBarIcon({ color: '#fff', size: 20 }).props.name);
    expect(nomes).toEqual(['stats-chart', 'star', 'person']);
  });
});
