import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Login from '@/app/login';
import { supabase } from '@/lib/supabase';

let mockConfigurado = true;
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn(), signUp: jest.fn() } },
  get supabaseConfigurado() {
    return mockConfigurado;
  },
}));

const entrarNoSupabase = supabase.auth.signInWithPassword as jest.Mock;
const cadastrarNoSupabase = supabase.auth.signUp as jest.Mock;

async function preencher(email: string, senha: string) {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), senha);
}

beforeEach(() => {
  mockConfigurado = true;
});

describe('tela de login', () => {
  test('mostra nome do app, campos e os dois botões', async () => {
    await render(<Login />);
    expect(screen.getByText('Economia Hoje')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByText('Entrar')).toBeTruthy();
    expect(screen.getByText('Criar conta')).toBeTruthy();
  });

  test('Supabase configurado: não mostra o aviso do .env', async () => {
    await render(<Login />);
    expect(screen.queryByText(/Supabase não configurado/)).toBeNull();
  });

  test('Supabase sem .env: mostra o aviso', async () => {
    mockConfigurado = false;
    await render(<Login />);
    expect(screen.getByText(/Supabase não configurado/)).toBeTruthy();
  });

  test('Entrar envia e-mail e senha digitados', async () => {
    entrarNoSupabase.mockResolvedValue({ error: null });
    await render(<Login />);
    await preencher('ana@teste.com', 'segredo123');
    await fireEvent.press(screen.getByText('Entrar'));
    await waitFor(() =>
      expect(entrarNoSupabase).toHaveBeenCalledWith({ email: 'ana@teste.com', password: 'segredo123' }),
    );
  });

  test('Entrar com erro mostra a mensagem', async () => {
    entrarNoSupabase.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await render(<Login />);
    await preencher('ana@teste.com', 'errada');
    await fireEvent.press(screen.getByText('Entrar'));
    expect(await screen.findByText('Não foi possível entrar: Invalid login credentials')).toBeTruthy();
  });

  test('Entrar com sucesso não mostra erro', async () => {
    entrarNoSupabase.mockResolvedValue({ error: null });
    await render(<Login />);
    await preencher('ana@teste.com', 'segredo123');
    await fireEvent.press(screen.getByText('Entrar'));
    await waitFor(() => expect(entrarNoSupabase).toHaveBeenCalled());
    expect(screen.queryByText(/Não foi possível/)).toBeNull();
  });

  test('enquanto entra, o botão mostra "Aguarde..."', async () => {
    let terminar: (v: unknown) => void = () => undefined;
    entrarNoSupabase.mockReturnValue(new Promise((resolver) => (terminar = resolver)));
    await render(<Login />);
    await preencher('ana@teste.com', 'segredo123');
    // Não esperamos o toque terminar: a resposta do Supabase ainda está pendente.
    const toque = fireEvent.press(screen.getByText('Entrar'));
    expect(await screen.findByText('Aguarde...')).toBeTruthy();
    terminar({ error: null });
    await toque;
    expect(await screen.findByText('Entrar')).toBeTruthy();
  });

  test('uma nova tentativa limpa a mensagem de erro anterior', async () => {
    entrarNoSupabase.mockResolvedValueOnce({ error: { message: 'falhou' } }).mockResolvedValueOnce({ error: null });
    await render(<Login />);
    await preencher('a@a.com', '123456');
    await fireEvent.press(screen.getByText('Entrar'));
    await screen.findByText(/falhou/);
    await fireEvent.press(screen.getByText('Entrar'));
    await waitFor(() => expect(screen.queryByText(/falhou/)).toBeNull());
  });

  test('Criar conta envia e-mail e senha', async () => {
    cadastrarNoSupabase.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
    await render(<Login />);
    await preencher('nova@teste.com', 'segredo123');
    await fireEvent.press(screen.getByText('Criar conta'));
    await waitFor(() =>
      expect(cadastrarNoSupabase).toHaveBeenCalledWith({ email: 'nova@teste.com', password: 'segredo123' }),
    );
  });

  test('Criar conta sem sessão pede para confirmar o e-mail', async () => {
    cadastrarNoSupabase.mockResolvedValue({ data: { session: null }, error: null });
    await render(<Login />);
    await preencher('nova@teste.com', 'segredo123');
    await fireEvent.press(screen.getByText('Criar conta'));
    expect(await screen.findByText(/Confirme o e-mail/)).toBeTruthy();
  });

  test('Criar conta com sessão (entrou direto) não mostra mensagem', async () => {
    cadastrarNoSupabase.mockResolvedValue({ data: { session: { access_token: 'x' } }, error: null });
    await render(<Login />);
    await preencher('nova@teste.com', 'segredo123');
    await fireEvent.press(screen.getByText('Criar conta'));
    await waitFor(() => expect(cadastrarNoSupabase).toHaveBeenCalled());
    expect(screen.queryByText(/Confirme o e-mail/)).toBeNull();
  });

  test('Criar conta com erro mostra a mensagem', async () => {
    cadastrarNoSupabase.mockResolvedValue({ data: { session: null }, error: { message: 'email rate limit exceeded' } });
    await render(<Login />);
    await preencher('nova@teste.com', 'segredo123');
    await fireEvent.press(screen.getByText('Criar conta'));
    expect(await screen.findByText('Não foi possível criar a conta: email rate limit exceeded')).toBeTruthy();
  });

  test('campos vazios: o app não envia nada ao Supabase', async () => {
    entrarNoSupabase.mockResolvedValue({ error: { message: 'x' } });
    await render(<Login />);
    await fireEvent.press(screen.getByText('Entrar'));
    await waitFor(() => expect(entrarNoSupabase).not.toHaveBeenCalled());
  });
});
