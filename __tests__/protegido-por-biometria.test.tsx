import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import ProtegidoPorBiometria, { bloquearAbas } from '@/components/protegido-por-biometria';
import { confirmarBiometria } from '@/lib/biometria';

jest.mock('@/lib/biometria', () => ({ confirmarBiometria: jest.fn() }));

const confirmar = confirmarBiometria as jest.Mock;

function conteudo() {
  return (
    <ProtegidoPorBiometria>
      <Text>conteúdo secreto</Text>
    </ProtegidoPorBiometria>
  );
}

beforeEach(() => {
  bloquearAbas(); // cada teste começa como se ninguém tivesse sido liberado
});

describe('ProtegidoPorBiometria', () => {
  test('enquanto pede a biometria mostra a tela de carregamento', async () => {
    confirmar.mockReturnValue(new Promise(() => undefined)); // nunca responde
    await render(conteudo());
    expect(screen.getByText('Buscando informações...')).toBeTruthy();
    expect(screen.queryByText('conteúdo secreto')).toBeNull();
  });

  test('pede a biometria com a mensagem certa ao abrir', async () => {
    confirmar.mockResolvedValue(true);
    await render(conteudo());
    await screen.findByText('conteúdo secreto');
    expect(confirmar).toHaveBeenCalledWith('Confirme que é você');
  });

  test('confirmando, mostra o conteúdo', async () => {
    confirmar.mockResolvedValue(true);
    await render(conteudo());
    expect(await screen.findByText('conteúdo secreto')).toBeTruthy();
  });

  test('cancelando, mostra "Conteúdo protegido" e esconde o conteúdo', async () => {
    confirmar.mockResolvedValue(false);
    await render(conteudo());
    expect(await screen.findByText('Conteúdo protegido')).toBeTruthy();
    expect(screen.queryByText('conteúdo secreto')).toBeNull();
  });

  test('botão "Desbloquear" pede de novo e libera', async () => {
    confirmar.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await render(conteudo());
    await fireEvent.press(await screen.findByText('Desbloquear'));
    expect(await screen.findByText('conteúdo secreto')).toBeTruthy();
    expect(confirmar).toHaveBeenCalledTimes(2);
  });

  test('depois de liberado, outra aba abre direto, sem pedir de novo', async () => {
    confirmar.mockResolvedValue(true);
    const primeira = await render(conteudo());
    await primeira.findByText('conteúdo secreto');
    await primeira.unmount();
    confirmar.mockClear();

    await render(conteudo());
    expect(screen.getByText('conteúdo secreto')).toBeTruthy();
    expect(confirmar).not.toHaveBeenCalled();
  });

  test('bloquearAbas() faz a próxima aba pedir a biometria de novo', async () => {
    confirmar.mockResolvedValue(true);
    const primeira = await render(conteudo());
    await primeira.findByText('conteúdo secreto');
    await primeira.unmount();

    bloquearAbas();
    confirmar.mockClear();
    await render(conteudo());
    await waitFor(() => expect(confirmar).toHaveBeenCalledTimes(1));
  });

  test('ao ir para segundo plano, bloqueia o conteúdo', async () => {
    let aoMudar: (estado: string) => void = () => undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, funcao) => {
      aoMudar = funcao as (estado: string) => void;
      return { remove: jest.fn() };
    });
    confirmar.mockResolvedValue(true);
    await render(conteudo());
    await screen.findByText('conteúdo secreto');

    await act(() => aoMudar('background'));
    expect(screen.queryByText('conteúdo secreto')).toBeNull();
    expect(screen.getByText('Conteúdo protegido')).toBeTruthy();
  });

  test('estado "inactive" não bloqueia (o pedido de Face ID deixa o app inativo)', async () => {
    let aoMudar: (estado: string) => void = () => undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, funcao) => {
      aoMudar = funcao as (estado: string) => void;
      return { remove: jest.fn() };
    });
    confirmar.mockResolvedValue(true);
    await render(conteudo());
    await screen.findByText('conteúdo secreto');

    await act(() => aoMudar('inactive'));
    expect(screen.getByText('conteúdo secreto')).toBeTruthy();
  });
});
