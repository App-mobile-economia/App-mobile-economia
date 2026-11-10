import { renderHook, waitFor } from '@testing-library/react-native';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

import { useSacudir } from '@/hooks/use-sacudir';

const disponivel = Accelerometer.isAvailableAsync as jest.Mock;
const ouvir = Accelerometer.addListener as jest.Mock;

let remover: jest.Mock;
let enviarLeitura: (leitura: { x: number; y: number; z: number }) => void;

beforeEach(() => {
  remover = jest.fn();
  disponivel.mockResolvedValue(true);
  ouvir.mockImplementation((funcao) => {
    enviarLeitura = funcao;
    return { remove: remover };
  });
  Platform.OS = 'android';
  jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useSacudir', () => {
  test('liga o sensor lendo a cada 100 ms', async () => {
    await renderHook(() => useSacudir(jest.fn()));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(100);
  });

  test('sacudida forte (acima de 1,8 g) chama a função', async () => {
    const aoSacudir = jest.fn();
    await renderHook(() => useSacudir(aoSacudir));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    enviarLeitura({ x: 2, y: 1, z: 1 });
    expect(aoSacudir).toHaveBeenCalledTimes(1);
  });

  test('celular parado (perto de 1 g) não chama', async () => {
    const aoSacudir = jest.fn();
    await renderHook(() => useSacudir(aoSacudir));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    enviarLeitura({ x: 0, y: 0, z: 1 });
    expect(aoSacudir).not.toHaveBeenCalled();
  });

  test('movimento fraco (1,5 g) não chama', async () => {
    const aoSacudir = jest.fn();
    await renderHook(() => useSacudir(aoSacudir));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    enviarLeitura({ x: 0.9, y: 0.9, z: 0.9 });
    expect(aoSacudir).not.toHaveBeenCalled();
  });

  test('duas sacudidas seguidas (antes de 1,5 s) chamam só uma vez', async () => {
    const aoSacudir = jest.fn();
    await renderHook(() => useSacudir(aoSacudir));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    enviarLeitura({ x: 2, y: 2, z: 2 });
    enviarLeitura({ x: 2, y: 2, z: 2 });
    expect(aoSacudir).toHaveBeenCalledTimes(1);
  });

  test('depois de 1,5 s uma nova sacudida chama de novo', async () => {
    const aoSacudir = jest.fn();
    await renderHook(() => useSacudir(aoSacudir));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    enviarLeitura({ x: 2, y: 2, z: 2 });
    (Date.now as jest.Mock).mockReturnValue(1_002_000);
    enviarLeitura({ x: 2, y: 2, z: 2 });
    expect(aoSacudir).toHaveBeenCalledTimes(2);
  });

  test('chama sempre a versão mais nova da função recebida', async () => {
    const antiga = jest.fn();
    const nova = jest.fn();
    const { rerender } = await renderHook((props: { f: () => void }) => useSacudir(props.f), {
      initialProps: { f: antiga },
    });
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    await rerender({ f: nova });
    enviarLeitura({ x: 2, y: 2, z: 2 });
    expect(nova).toHaveBeenCalledTimes(1);
    expect(antiga).not.toHaveBeenCalled();
  });

  test('ao fechar a tela, desliga o sensor', async () => {
    const { unmount } = await renderHook(() => useSacudir(jest.fn()));
    await waitFor(() => expect(ouvir).toHaveBeenCalled());
    await unmount();
    expect(remover).toHaveBeenCalled();
  });

  test('aparelho sem acelerômetro não liga nada', async () => {
    disponivel.mockResolvedValue(false);
    await renderHook(() => useSacudir(jest.fn()));
    await waitFor(() => expect(disponivel).toHaveBeenCalled());
    expect(ouvir).not.toHaveBeenCalled();
  });

  test('na web o sensor não é usado', async () => {
    Platform.OS = 'web';
    await renderHook(() => useSacudir(jest.fn()));
    expect(disponivel).not.toHaveBeenCalled();
    expect(ouvir).not.toHaveBeenCalled();
  });
});
