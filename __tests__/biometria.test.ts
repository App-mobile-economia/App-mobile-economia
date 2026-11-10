import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { confirmarBiometria } from '@/lib/biometria';

const sensor = LocalAuthentication.hasHardwareAsync as jest.Mock;
const cadastrada = LocalAuthentication.isEnrolledAsync as jest.Mock;
const autenticar = LocalAuthentication.authenticateAsync as jest.Mock;

const sistemaOriginal = Platform.OS;
afterEach(() => {
  Platform.OS = sistemaOriginal;
});

describe('confirmarBiometria', () => {
  test('na web libera direto, sem pedir nada', async () => {
    Platform.OS = 'web';
    await expect(confirmarBiometria('teste')).resolves.toBe(true);
    expect(autenticar).not.toHaveBeenCalled();
  });

  test('aparelho sem sensor libera', async () => {
    Platform.OS = 'android';
    sensor.mockResolvedValue(false);
    cadastrada.mockResolvedValue(true);
    await expect(confirmarBiometria('teste')).resolves.toBe(true);
    expect(autenticar).not.toHaveBeenCalled();
  });

  test('sem digital ou rosto cadastrado libera', async () => {
    Platform.OS = 'android';
    sensor.mockResolvedValue(true);
    cadastrada.mockResolvedValue(false);
    await expect(confirmarBiometria('teste')).resolves.toBe(true);
    expect(autenticar).not.toHaveBeenCalled();
  });

  test('com biometria, pede e devolve true quando a pessoa confirma', async () => {
    Platform.OS = 'android';
    sensor.mockResolvedValue(true);
    cadastrada.mockResolvedValue(true);
    autenticar.mockResolvedValue({ success: true });
    await expect(confirmarBiometria('Confirme para sair')).resolves.toBe(true);
    expect(autenticar).toHaveBeenCalledWith({ promptMessage: 'Confirme para sair', cancelLabel: 'Cancelar' });
  });

  test('devolve false quando a pessoa cancela ou erra', async () => {
    Platform.OS = 'android';
    sensor.mockResolvedValue(true);
    cadastrada.mockResolvedValue(true);
    autenticar.mockResolvedValue({ success: false, error: 'user_cancel' });
    await expect(confirmarBiometria('teste')).resolves.toBe(false);
  });
});
