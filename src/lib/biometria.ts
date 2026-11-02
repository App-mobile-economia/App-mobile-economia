// Pede digital ou rosto (ou a senha do aparelho, como reserva do sistema).
// Devolve true se a pessoa confirmou, ou se não dá para pedir: na web, sem sensor ou sem biometria cadastrada.
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export async function confirmarBiometria(mensagem: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const temSensor = await LocalAuthentication.hasHardwareAsync();
  const cadastrada = await LocalAuthentication.isEnrolledAsync();
  if (!temSensor || !cadastrada) return true;

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: mensagem,
    cancelLabel: 'Cancelar',
  });
  return resultado.success;
}
