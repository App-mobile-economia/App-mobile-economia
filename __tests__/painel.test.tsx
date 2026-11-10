import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useNetworkState } from 'expo-network';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

import Painel from '@/app/(tabs)/index';
import { adicionarFavorito, listarFavoritos, removerFavorito } from '@/services/favoritos';
import { apisFuncionando, resposta } from '../jest/apis-falsas';

jest.mock('@/services/favoritos', () => ({
  listarFavoritos: jest.fn(),
  adicionarFavorito: jest.fn(),
  removerFavorito: jest.fn(),
}));

const fetchFalso = jest.fn();
const rede = useNetworkState as jest.Mock;
const listar = listarFavoritos as jest.Mock;
const adicionar = adicionarFavorito as jest.Mock;
const remover = removerFavorito as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  fetchFalso.mockReset();
  fetchFalso.mockImplementation(apisFuncionando);
  globalThis.fetch = fetchFalso as unknown as typeof fetch;
  rede.mockReturnValue({ isConnected: true, isInternetReachable: true });
  listar.mockResolvedValue([]);
  adicionar.mockResolvedValue(undefined);
  remover.mockResolvedValue(undefined);
  (Accelerometer.isAvailableAsync as jest.Mock).mockResolvedValue(false);
  Platform.OS = 'android';
});

async function abrirPainel() {
  await render(<Painel />);
  await screen.findByText('IPCA do mês');
}

describe('Painel: carregamento', () => {
  test('primeiro mostra a tela de carregamento', async () => {
    fetchFalso.mockReturnValue(new Promise(() => undefined)); // as APIs demoram
    await render(<Painel />);
    expect(screen.getByText('Buscando informações...')).toBeTruthy();
  });

  test('depois mostra os 15 cartões', async () => {
    await abrirPainel();
    for (const titulo of [
      'IPCA do mês', 'IPCA 12 meses', 'INPC do mês', 'IGP-M do mês', 'Selic (meta)', 'CDI (ao ano)',
      'Dólar (venda)', 'Euro (venda)', 'Desemprego', 'Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)',
      'XRP (XRP)', 'BNB (BNB)', 'Dogecoin (DOGE)',
    ]) {
      expect(screen.getByText(titulo)).toBeTruthy();
    }
  });

  test('mostra as seções Economia e Criptomoedas', async () => {
    await abrirPainel();
    expect(screen.getAllByText('Economia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Criptomoedas').length).toBeGreaterThan(0);
  });

  test('mostra "Atualizado às HH:MM"', async () => {
    await abrirPainel();
    expect(screen.getByText(/Atualizado às \d{2}:\d{2}/)).toBeTruthy();
  });

  test('guarda os dados no cache do aparelho', async () => {
    await abrirPainel();
    const salvo = await AsyncStorage.getItem('ultimos_indicadores');
    expect(salvo).not.toBeNull();
    expect(JSON.parse(salvo as string).lista).toHaveLength(15);
  });

  test('sem avisos quando tudo deu certo', async () => {
    await abrirPainel();
    expect(screen.queryByText(/offline/)).toBeNull();
    expect(screen.queryByText(/Sem conexão/)).toBeNull();
  });
});

describe('Painel: falhas e modo offline', () => {
  test('uma fonte fora do ar: avisa e mostra o que veio', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('coingecko') ? resposta({}, false, 429) : apisFuncionando(url),
    );
    await render(<Painel />);
    expect(await screen.findByText(/Sem conexão com alguma fonte/)).toBeTruthy();
    expect(screen.getByText('IPCA do mês')).toBeTruthy();
    expect(screen.queryByText('Bitcoin (BTC)')).toBeNull();
  });

  test('fonte fora do ar completa com os dados do cache', async () => {
    await abrirPainel(); // enche o cache com os 15
    fetchFalso.mockImplementation((url: string) =>
      url.includes('coingecko') ? resposta({}, false, 429) : apisFuncionando(url),
    );
    const segunda = await render(<Painel />);
    expect(await segunda.findByText(/Sem conexão com alguma fonte/)).toBeTruthy();
    expect(segunda.getAllByText('Bitcoin (BTC)').length).toBeGreaterThan(0);
  });

  test('sem internet, mostra os dados salvos e a hora da última atualização', async () => {
    await abrirPainel();
    const horaSalva = JSON.parse((await AsyncStorage.getItem('ultimos_indicadores')) as string).hora;
    fetchFalso.mockRejectedValue(new Error('Network request failed'));
    rede.mockReturnValue({ isConnected: false, isInternetReachable: false });

    const segunda = await render(<Painel />);
    expect(await segunda.findByText(new RegExp('Você está offline.*' + horaSalva))).toBeTruthy();
    expect(segunda.getAllByText('IPCA do mês').length).toBeGreaterThan(0);
  });

  test('aviso offline aparece mesmo sem nada no cache', async () => {
    fetchFalso.mockRejectedValue(new Error('Network request failed'));
    rede.mockReturnValue({ isConnected: false, isInternetReachable: false });
    await render(<Painel />);
    expect(await screen.findByText(/Você está offline/)).toBeTruthy();
  });

  test('sem internet e sem cache: mostra "Sem dados" e não fica carregando para sempre', async () => {
    fetchFalso.mockRejectedValue(new Error('Network request failed'));
    await render(<Painel />);
    expect(await screen.findByText('Sem dados')).toBeTruthy();
  });

  test('quando a internet volta, atualiza sozinho', async () => {
    rede.mockReturnValue({ isConnected: false, isInternetReachable: false });
    const tela = await render(<Painel />);
    await tela.findByText('IPCA do mês');
    const chamadasAntes = fetchFalso.mock.calls.length;

    rede.mockReturnValue({ isConnected: true, isInternetReachable: true });
    await tela.rerender(<Painel />);
    await waitFor(() => expect(fetchFalso.mock.calls.length).toBeGreaterThan(chamadasAntes));
  });

  test('cache corrompido não deixa o Painel travado', async () => {
    await AsyncStorage.setItem('ultimos_indicadores', '{texto quebrado');
    await render(<Painel />);
    expect(await screen.findByText('IPCA do mês', {}, { timeout: 3000 })).toBeTruthy();
  });
});

describe('Painel: atualizar', () => {
  test('puxar a tela para baixo busca os dados de novo', async () => {
    await abrirPainel();
    const antes = fetchFalso.mock.calls.length;
    const rolagem = screen.container.queryAll((no) => no.props.refreshControl !== undefined)[0];
    await act(async () => {
      await rolagem.props.refreshControl.props.onRefresh();
    });
    expect(fetchFalso.mock.calls.length).toBeGreaterThan(antes);
  });

  test('sacudir o celular busca os dados de novo', async () => {
    let enviarLeitura: (l: { x: number; y: number; z: number }) => void = () => undefined;
    (Accelerometer.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Accelerometer.addListener as jest.Mock).mockImplementation((funcao) => {
      enviarLeitura = funcao;
      return { remove: jest.fn() };
    });
    await abrirPainel();
    await waitFor(() => expect(Accelerometer.addListener).toHaveBeenCalled());
    const antes = fetchFalso.mock.calls.length;
    await act(async () => {
      enviarLeitura({ x: 2, y: 2, z: 2 });
    });
    await waitFor(() => expect(fetchFalso.mock.calls.length).toBeGreaterThan(antes));
  });
});

describe('Painel: filtros por grupo', () => {
  test('"Criptomoedas" esconde a Economia', async () => {
    await abrirPainel();
    await fireEvent.press(screen.getAllByText('Criptomoedas')[0]);
    expect(screen.queryByText('IPCA do mês')).toBeNull();
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });

  test('"Economia" esconde as criptomoedas', async () => {
    await abrirPainel();
    await fireEvent.press(screen.getAllByText('Economia')[0]);
    expect(screen.queryByText('Bitcoin (BTC)')).toBeNull();
    expect(screen.getByText('IPCA do mês')).toBeTruthy();
  });

  test('"Todos" mostra tudo de novo', async () => {
    await abrirPainel();
    await fireEvent.press(screen.getAllByText('Economia')[0]);
    await fireEvent.press(screen.getByText('Todos'));
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
    expect(screen.getByText('IPCA do mês')).toBeTruthy();
  });
});

describe('Painel: busca', () => {
  test('"inflacao" (sem acento) acha IPCA, INPC e IGP-M e esconde a Selic', async () => {
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'inflacao');
    expect(screen.getByText('IPCA do mês')).toBeTruthy();
    expect(screen.getByText('INPC do mês')).toBeTruthy();
    expect(screen.getByText('IGP-M do mês')).toBeTruthy();
    expect(screen.queryByText('Selic (meta)')).toBeNull();
  });

  test('"juros" acha Selic e CDI', async () => {
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'juros');
    expect(screen.getByText('Selic (meta)')).toBeTruthy();
    expect(screen.getByText('CDI (ao ano)')).toBeTruthy();
    expect(screen.queryByText('Dólar (venda)')).toBeNull();
  });

  test('uma letra só não filtra', async () => {
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'z');
    expect(screen.getByText('IPCA do mês')).toBeTruthy();
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });

  test('o filtro de grupo é ignorado durante a busca', async () => {
    await abrirPainel();
    await fireEvent.press(screen.getAllByText('Economia')[0]); // filtro Economia
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'bitcoin');
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
  });

  test('busca por moeda fora do painel mostra "Outras criptomoedas" com ranking e mín/máx', async () => {
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'cardano');
    expect(await screen.findByText('Outras criptomoedas', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('Cardano (ADA)')).toBeTruthy();
    expect(screen.getByText(/#9 no ranking/)).toBeTruthy();
  });

  test('espera a pessoa parar de digitar antes de chamar a CoinGecko', async () => {
    await abrirPainel();
    const campo = screen.getByLabelText('Buscar indicador ou moeda');
    fetchFalso.mockClear();
    await fireEvent.changeText(campo, 'ca');
    await fireEvent.changeText(campo, 'car');
    await fireEvent.changeText(campo, 'card');
    expect(fetchFalso).not.toHaveBeenCalled();
    await waitFor(() => expect(fetchFalso).toHaveBeenCalled(), { timeout: 3000 });
    const buscas = fetchFalso.mock.calls.filter((c) => String(c[0]).includes('/search'));
    expect(buscas).toHaveLength(1);
    expect(String(buscas[0][0])).toContain('query=card');
  });

  test('moeda que já está no painel não repete em "Outras criptomoedas"', async () => {
    fetchFalso.mockImplementation((url: string) => {
      if (url.includes('/search')) return resposta({ coins: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' }] });
      if (url.includes('/coins/markets')) {
        return resposta([
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 1, price_change_percentage_24h: 0, market_cap_rank: 1, low_24h: 1, high_24h: 1 },
        ]);
      }
      return apisFuncionando(url);
    });
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'bitcoin');
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/search'))).toBe(true), {
      timeout: 3000,
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(screen.queryByText('Outras criptomoedas')).toBeNull();
  });

  test('nada encontrado mostra a mensagem', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('/search') ? resposta({ coins: [] }) : apisFuncionando(url),
    );
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'xyzxyz');
    expect(await screen.findByText(/Nada encontrado para "xyzxyz"/)).toBeTruthy();
  });

  test('erro na busca (429) não quebra a tela', async () => {
    fetchFalso.mockImplementation((url: string) =>
      url.includes('/search') ? resposta({}, false, 429) : apisFuncionando(url),
    );
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'cardano');
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/search'))).toBe(true), {
      timeout: 3000,
    });
    expect(screen.queryByText('Outras criptomoedas')).toBeNull();
  });

  test('limpar a busca volta ao painel completo', async () => {
    await abrirPainel();
    const campo = screen.getByLabelText('Buscar indicador ou moeda');
    await fireEvent.changeText(campo, 'juros');
    await fireEvent.changeText(campo, '');
    expect(screen.getByText('Bitcoin (BTC)')).toBeTruthy();
    expect(screen.getByText('Dólar (venda)')).toBeTruthy();
  });
});

describe('Painel: favoritos', () => {
  test('carrega os favoritos ao abrir', async () => {
    await abrirPainel();
    expect(listar).toHaveBeenCalled();
  });

  test('favorito existente aparece com a estrela cheia', async () => {
    listar.mockResolvedValue([{ id: 1, indicador: 'ipca', nota: '' }]);
    await abrirPainel();
    expect(await screen.findByLabelText('Remover IPCA do mês dos favoritos')).toBeTruthy();
    expect(screen.getByLabelText('Favoritar Selic (meta)')).toBeTruthy();
  });

  test('tocar na estrela vazia adiciona o favorito e atualiza a estrela', async () => {
    await abrirPainel();
    listar.mockResolvedValue([{ id: 5, indicador: 'selic', nota: '' }]);
    await fireEvent.press(screen.getByLabelText('Favoritar Selic (meta)'));
    await waitFor(() => expect(adicionar).toHaveBeenCalledWith('selic'));
    expect(await screen.findByLabelText('Remover Selic (meta) dos favoritos')).toBeTruthy();
  });

  test('tocar na estrela cheia remove o favorito', async () => {
    listar.mockResolvedValue([{ id: 9, indicador: 'selic', nota: '' }]);
    await abrirPainel();
    const estrela = await screen.findByLabelText('Remover Selic (meta) dos favoritos');
    listar.mockResolvedValue([]);
    await fireEvent.press(estrela);
    await waitFor(() => expect(remover).toHaveBeenCalledWith(9));
    expect(await screen.findByLabelText('Favoritar Selic (meta)')).toBeTruthy();
  });

  test('moeda da busca é favoritada com a chave "cripto:id"', async () => {
    await abrirPainel();
    await fireEvent.changeText(screen.getByLabelText('Buscar indicador ou moeda'), 'cardano');
    const estrela = await screen.findByLabelText('Favoritar Cardano (ADA)', {}, { timeout: 3000 });
    await fireEvent.press(estrela);
    await waitFor(() => expect(adicionar).toHaveBeenCalledWith('cripto:cardano'));
  });

  test('erro ao favoritar mostra mensagem', async () => {
    adicionar.mockRejectedValue(new Error('falhou'));
    await abrirPainel();
    await fireEvent.press(screen.getByLabelText('Favoritar Selic (meta)'));
    expect(await screen.findByText('Não foi possível atualizar os favoritos.')).toBeTruthy();
  });

  test('erro ao carregar os favoritos mostra mensagem', async () => {
    listar.mockRejectedValue(new Error('PGRST205'));
    await render(<Painel />);
    expect(await screen.findByText('Não foi possível carregar os favoritos.')).toBeTruthy();
  });
});
