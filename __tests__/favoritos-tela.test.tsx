import { Accelerometer } from 'expo-sensors';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Favoritos from '@/app/(tabs)/favoritos';
import { bloquearAbas } from '@/components/protegido-por-biometria';
import { confirmarBiometria } from '@/lib/biometria';
import { atualizarNota, listarFavoritos, removerFavorito } from '@/services/favoritos';
import { buscarHistoricos } from '@/services/historico';

jest.mock('@/lib/biometria', () => ({ confirmarBiometria: jest.fn() }));
jest.mock('@/services/favoritos', () => ({
  listarFavoritos: jest.fn(),
  atualizarNota: jest.fn(),
  removerFavorito: jest.fn(),
}));
// Mantém as funções de texto reais e troca só a busca na internet.
jest.mock('@/services/historico', () => ({
  ...jest.requireActual('@/services/historico'),
  buscarHistoricos: jest.fn(),
}));

const confirmar = confirmarBiometria as jest.Mock;
const listar = listarFavoritos as jest.Mock;
const gravarNota = atualizarNota as jest.Mock;
const apagar = removerFavorito as jest.Mock;
const historicos = buscarHistoricos as jest.Mock;

const selic = { id: 1, indicador: 'selic', nota: 'minha nota' };
const bitcoin = { id: 2, indicador: 'bitcoin', nota: '' };

beforeEach(() => {
  bloquearAbas();
  confirmar.mockResolvedValue(true);
  listar.mockResolvedValue([selic, bitcoin]);
  gravarNota.mockResolvedValue(undefined);
  apagar.mockResolvedValue(undefined);
  historicos.mockResolvedValue({
    selic: { status: 'ok', resumo: { inicio: 10, fim: 10.75, minimo: 10, maximo: 11 } },
    bitcoin: { status: 'ok', resumo: { inicio: 100, fim: 110 } },
  });
});

async function abrir() {
  await render(<Favoritos />);
  await screen.findByText('Favoritos');
}

describe('aba Favoritos: acesso', () => {
  test('pede biometria antes de mostrar a lista', async () => {
    confirmar.mockResolvedValue(false);
    await render(<Favoritos />);
    expect(await screen.findByText('Conteúdo protegido')).toBeTruthy();
    expect(listar).not.toHaveBeenCalled();
  });

  test('biometria confirmada mostra a lista', async () => {
    await abrir();
    expect(await screen.findByText('Selic (meta)')).toBeTruthy();
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });
});

describe('aba Favoritos: lista', () => {
  test('sem favoritos mostra a orientação', async () => {
    listar.mockResolvedValue([]);
    await abrir();
    expect(await screen.findByText(/Nenhum favorito ainda/)).toBeTruthy();
  });

  test('erro ao carregar mostra mensagem e não a orientação', async () => {
    listar.mockRejectedValue(new Error('falhou'));
    await abrir();
    expect(await screen.findByText('Não foi possível carregar os favoritos.')).toBeTruthy();
    expect(screen.queryByText(/Nenhum favorito ainda/)).toBeNull();
  });

  test('mostra a nota salva de cada favorito', async () => {
    await abrir();
    expect(await screen.findByDisplayValue('minha nota')).toBeTruthy();
  });

  test('moeda vinda da busca aparece com o nome', async () => {
    listar.mockResolvedValue([{ id: 3, indicador: 'cripto:cardano', nota: '' }]);
    await abrir();
    expect(await screen.findByText('Cardano')).toBeTruthy();
  });
});

describe('aba Favoritos: notas e exclusão', () => {
  test('sair do campo salva a nota', async () => {
    await abrir();
    const campo = await screen.findByLabelText('Nota sobre Selic (meta)');
    await fireEvent(campo, 'endEditing', { nativeEvent: { text: 'nova nota' } });
    await waitFor(() => expect(gravarNota).toHaveBeenCalledWith(1, 'nova nota'));
  });

  test('erro ao salvar a nota mostra mensagem', async () => {
    gravarNota.mockRejectedValue(new Error('falhou'));
    await abrir();
    const campo = await screen.findByLabelText('Nota sobre Selic (meta)');
    await fireEvent(campo, 'endEditing', { nativeEvent: { text: 'x' } });
    expect(await screen.findByText('Não foi possível salvar a nota.')).toBeTruthy();
  });

  test('lixeira remove o favorito e recarrega a lista', async () => {
    await abrir();
    const lixeira = await screen.findByLabelText('Remover Selic (meta)');
    listar.mockResolvedValue([bitcoin]);
    await fireEvent.press(lixeira);
    await waitFor(() => expect(apagar).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Selic (meta)')).toBeNull());
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });

  test('erro ao remover mostra mensagem', async () => {
    apagar.mockRejectedValue(new Error('falhou'));
    await abrir();
    await fireEvent.press(await screen.findByLabelText('Remover Selic (meta)'));
    expect(await screen.findByText('Não foi possível remover o favorito.')).toBeTruthy();
  });
});

describe('aba Favoritos: filtros', () => {
  test('filtro "Economia" esconde as criptomoedas', async () => {
    await abrir();
    await screen.findByText('Selic (meta)');
    await fireEvent.press(screen.getAllByText('Economia')[0]);
    expect(screen.getByText('Selic (meta)')).toBeTruthy();
    expect(screen.queryByText('Bitcoin (BTC)')).toBeNull();
  });

  test('filtro "Criptomoedas" esconde a Economia', async () => {
    await abrir();
    await screen.findByText('Selic (meta)');
    await fireEvent.press(screen.getAllByText('Criptomoedas')[0]);
    expect(screen.queryByText('Selic (meta)')).toBeNull();
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });

  test('"Todos" volta a mostrar tudo', async () => {
    await abrir();
    await screen.findByText('Selic (meta)');
    await fireEvent.press(screen.getAllByText('Economia')[0]);
    await fireEvent.press(screen.getByText('Todos'));
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });
});

describe('aba Favoritos: histórico', () => {
  test('o período padrão é 30 dias', async () => {
    await abrir();
    await waitFor(() => expect(historicos).toHaveBeenCalled());
    expect(historicos.mock.calls[0][1]).toBe(30);
  });

  test('trocar para 7 dias e 12 meses busca com os dias certos', async () => {
    await abrir();
    await screen.findByText('Selic (meta)');
    await fireEvent.press(screen.getByText('7 dias'));
    await waitFor(() => expect(historicos).toHaveBeenLastCalledWith(expect.anything(), 7));
    await fireEvent.press(screen.getByText('12 meses'));
    await waitFor(() => expect(historicos).toHaveBeenLastCalledWith(expect.anything(), 365));
  });

  test('enquanto busca mostra "Carregando histórico..."', async () => {
    historicos.mockReturnValue(new Promise(() => undefined));
    await abrir();
    expect((await screen.findAllByText('Carregando histórico...')).length).toBe(2);
  });

  test('taxa (Selic) mostra variação em p.p., valores e mín/máx', async () => {
    await abrir();
    expect(await screen.findByText('+0,75 p.p.')).toBeTruthy();
    expect(screen.getByText('De 10,00% para 10,75%')).toBeTruthy();
    expect(screen.getByText('Mín 10,00% · Máx 11,00%')).toBeTruthy();
  });

  test('criptomoeda mostra variação em % e valores, sem mín/máx', async () => {
    await abrir();
    expect(await screen.findByText('+10,00%')).toBeTruthy();
    expect(screen.getAllByText(/Mín/)).toHaveLength(1); // só a Selic tem
  });

  test('"sem-dados" mostra o aviso de pouca frequência', async () => {
    historicos.mockResolvedValue({ selic: { status: 'sem-dados' }, bitcoin: { status: 'sem-dados' } });
    await abrir();
    expect((await screen.findAllByText(/Sem dados neste período/)).length).toBe(2);
  });

  test('"erro" mostra que não foi possível carregar o histórico', async () => {
    historicos.mockResolvedValue({ selic: { status: 'erro' }, bitcoin: { status: 'erro' } });
    await abrir();
    expect((await screen.findAllByText('Não foi possível carregar o histórico.')).length).toBe(2);
  });

  test('só um favorito com erro não afeta os outros', async () => {
    historicos.mockResolvedValue({
      selic: { status: 'erro' },
      bitcoin: { status: 'ok', resumo: { inicio: 100, fim: 110 } },
    });
    await abrir();
    expect(await screen.findByText('Não foi possível carregar o histórico.')).toBeTruthy();
    expect(screen.getByText('+10,00%')).toBeTruthy();
  });

  test('sem favoritos não busca histórico', async () => {
    listar.mockResolvedValue([]);
    await abrir();
    await screen.findByText(/Nenhum favorito ainda/);
    expect(historicos).not.toHaveBeenCalled();
  });

  test('busca o histórico das chaves dos favoritos, incluindo moedas da busca', async () => {
    listar.mockResolvedValue([{ id: 3, indicador: 'cripto:cardano', nota: '' }]);
    await abrir();
    await waitFor(() => expect(historicos).toHaveBeenCalled());
    const metas = historicos.mock.calls[0][0];
    expect(metas[0].chave).toBe('cripto:cardano');
    expect(metas[0].idCripto).toBe('cardano');
  });
});

describe('aba Favoritos: sacudir', () => {
  test('sacudir o celular recarrega a lista e busca o histórico de novo', async () => {
    let enviarLeitura: (leitura: { x: number; y: number; z: number }) => void = () => undefined;
    (Accelerometer.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Accelerometer.addListener as jest.Mock).mockImplementation((funcao) => {
      enviarLeitura = funcao;
      return { remove: jest.fn() };
    });
    await abrir();
    await waitFor(() => expect(historicos).toHaveBeenCalledTimes(1));
    const listagensAntes = listar.mock.calls.length;

    enviarLeitura({ x: 2, y: 1, z: 1 });

    await waitFor(() => expect(historicos).toHaveBeenCalledTimes(2));
    expect(listar.mock.calls.length).toBeGreaterThan(listagensAntes);
  });
});
