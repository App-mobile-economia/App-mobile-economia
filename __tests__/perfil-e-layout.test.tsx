import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RootLayout from '@/app/_layout';
import Perfil from '@/app/(tabs)/perfil';
import { bloquearAbas } from '@/components/protegido-por-biometria';
import { confirmarBiometria } from '@/lib/biometria';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/biometria', () => ({ confirmarBiometria: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn(), signOut: jest.fn(), onAuthStateChange: jest.fn(), updateUser: jest.fn() },
  },
}));

// Navegação de teste: só mostra as telas liberadas pelos guardas.
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  Stack: Object.assign(({ children }: { children: React.ReactNode }) => <>{children}</>, {
    Protected: ({ guard, children }: { guard: boolean; children: React.ReactNode }) => (guard ? <>{children}</> : null),
    Screen: ({ name }: { name: string }) => require('react').createElement(require('react-native').Text, null, 'tela:' + name),
  }),
}));

const confirmar = confirmarBiometria as jest.Mock;
const pegarSessao = supabase.auth.getSession as jest.Mock;
const sair = supabase.auth.signOut as jest.Mock;
const escutar = supabase.auth.onAuthStateChange as jest.Mock;

describe('aba Perfil', () => {
  beforeEach(() => {
    bloquearAbas();
    confirmar.mockResolvedValue(true);
    pegarSessao.mockResolvedValue({ data: { session: { user: { email: 'ana@teste.com' } } } });
    sair.mockResolvedValue({ error: null });
  });

  test('mostra o e-mail de quem está logado', async () => {
    await render(<Perfil />);
    expect(await screen.findByText('ana@teste.com')).toBeTruthy();
    expect(screen.getByText('Economia Hoje')).toBeTruthy();
  });

  test('sem sessão, não quebra e não mostra e-mail', async () => {
    pegarSessao.mockResolvedValue({ data: { session: null } });
    await render(<Perfil />);
    await screen.findByText('Sair');
    expect(screen.queryByText(/@/)).toBeNull();
  });

  test('a aba só abre depois da biometria', async () => {
    confirmar.mockResolvedValue(false);
    await render(<Perfil />);
    expect(await screen.findByText('Conteúdo protegido')).toBeTruthy();
    expect(screen.queryByText('Sair')).toBeNull();
  });

  test('Sair pede biometria e depois encerra a sessão', async () => {
    await render(<Perfil />);
    await fireEvent.press(await screen.findByText('Sair'));
    await waitFor(() => expect(sair).toHaveBeenCalledTimes(1));
    expect(confirmar).toHaveBeenCalledWith('Confirme para sair');
  });

  test('Sair com biometria cancelada continua logado', async () => {
    await render(<Perfil />);
    const botao = await screen.findByText('Sair');
    confirmar.mockClear();
    confirmar.mockResolvedValue(false);
    await fireEvent.press(botao);
    await waitFor(() => expect(confirmar).toHaveBeenCalledWith('Confirme para sair'));
    expect(sair).not.toHaveBeenCalled();
  });

  test('ao sair, a próxima aba volta a pedir biometria', async () => {
    const primeira = await render(<Perfil />);
    await fireEvent.press(await primeira.findByText('Sair'));
    await waitFor(() => expect(sair).toHaveBeenCalled());
    await primeira.unmount();

    confirmar.mockClear();
    await render(<Perfil />);
    await waitFor(() => expect(confirmar).toHaveBeenCalledWith('Confirme que é você'));
  });
});

describe('layout raiz (porteiro do app)', () => {
  let avisarMudanca: (evento: string, sessao: unknown) => void;
  const desligar = jest.fn();

  beforeEach(() => {
    escutar.mockImplementation((funcao) => {
      avisarMudanca = funcao;
      return { data: { subscription: { unsubscribe: desligar } } };
    });
  });

  test('enquanto verifica a sessão mostra a tela de carregamento', async () => {
    pegarSessao.mockReturnValue(new Promise(() => undefined));
    await render(<RootLayout />);
    expect(screen.getByText('Buscando informações...')).toBeTruthy();
  });

  test('sem sessão libera só o login', async () => {
    pegarSessao.mockResolvedValue({ data: { session: null } });
    await render(<RootLayout />);
    expect(await screen.findByText('tela:login')).toBeTruthy();
    expect(screen.queryByText('tela:(tabs)')).toBeNull();
  });

  test('com sessão libera só as abas', async () => {
    pegarSessao.mockResolvedValue({ data: { session: { user: {} } } });
    await render(<RootLayout />);
    expect(await screen.findByText('tela:(tabs)')).toBeTruthy();
    expect(screen.queryByText('tela:login')).toBeNull();
  });

  test('ao entrar na conta, troca do login para as abas', async () => {
    pegarSessao.mockResolvedValue({ data: { session: null } });
    await render(<RootLayout />);
    await screen.findByText('tela:login');
    await act(() => avisarMudanca('SIGNED_IN', { user: {} }));
    expect(await screen.findByText('tela:(tabs)')).toBeTruthy();
    expect(screen.queryByText('tela:login')).toBeNull();
  });

  test('ao sair da conta, troca das abas para o login', async () => {
    pegarSessao.mockResolvedValue({ data: { session: { user: {} } } });
    await render(<RootLayout />);
    await screen.findByText('tela:(tabs)');
    await act(() => avisarMudanca('SIGNED_OUT', null));
    expect(await screen.findByText('tela:login')).toBeTruthy();
  });

  test('link de recuperar senha: mostra a tela de nova senha e depois libera o app', async () => {
    pegarSessao.mockResolvedValue({ data: { session: null } });
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });
    await render(<RootLayout />);
    await screen.findByText('tela:login');
    await act(() => avisarMudanca('PASSWORD_RECOVERY', { user: {} }));
    expect(await screen.findByText('Nova senha')).toBeTruthy();
    expect(screen.queryByText('tela:(tabs)')).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Nova senha'), 'segredo123');
    await fireEvent.changeText(screen.getByLabelText('Repetir nova senha'), 'segredo123');
    await fireEvent.press(screen.getByText('Salvar senha'));
    expect(await screen.findByText('tela:(tabs)')).toBeTruthy();
  });

  test('ao fechar, para de escutar as mudanças de sessão', async () => {
    pegarSessao.mockResolvedValue({ data: { session: null } });
    const tela = await render(<RootLayout />);
    await screen.findByText('tela:login');
    await tela.unmount();
    expect(desligar).toHaveBeenCalled();
  });
});
