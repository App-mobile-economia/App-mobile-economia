import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import NovaSenha from '@/components/nova-senha';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { updateUser: jest.fn() } },
}));

const trocarSenha = supabase.auth.updateUser as jest.Mock;

async function preencher(senha: string, repetida: string) {
  await fireEvent.changeText(screen.getByLabelText('Nova senha'), senha);
  await fireEvent.changeText(screen.getByLabelText('Repetir nova senha'), repetida);
}

describe('tela de nova senha', () => {
  test('senha curta: avisa e não chama o Supabase', async () => {
    await render(<NovaSenha aoTerminar={jest.fn()} />);
    await preencher('123', '123');
    await fireEvent.press(screen.getByText('Salvar senha'));
    expect(await screen.findByText('A senha precisa ter no mínimo 6 caracteres.')).toBeTruthy();
    expect(trocarSenha).not.toHaveBeenCalled();
  });

  test('senhas diferentes: avisa e não chama o Supabase', async () => {
    await render(<NovaSenha aoTerminar={jest.fn()} />);
    await preencher('segredo123', 'segredo124');
    await fireEvent.press(screen.getByText('Salvar senha'));
    expect(await screen.findByText('As senhas não são iguais.')).toBeTruthy();
    expect(trocarSenha).not.toHaveBeenCalled();
  });

  test('senha válida: salva e avisa que terminou', async () => {
    trocarSenha.mockResolvedValue({ error: null });
    const terminou = jest.fn();
    await render(<NovaSenha aoTerminar={terminou} />);
    await preencher('segredo123', 'segredo123');
    await fireEvent.press(screen.getByText('Salvar senha'));
    await waitFor(() => expect(terminou).toHaveBeenCalled());
    expect(trocarSenha).toHaveBeenCalledWith({ password: 'segredo123' });
  });

  test('erro do Supabase: mostra a mensagem e não conclui', async () => {
    trocarSenha.mockResolvedValue({ error: { message: 'Password should be different' } });
    const terminou = jest.fn();
    await render(<NovaSenha aoTerminar={terminou} />);
    await preencher('segredo123', 'segredo123');
    await fireEvent.press(screen.getByText('Salvar senha'));
    expect(await screen.findByText('Não foi possível alterar a senha: Password should be different')).toBeTruthy();
    expect(terminou).not.toHaveBeenCalled();
  });
});
