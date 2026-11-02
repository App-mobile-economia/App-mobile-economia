// Pede digital ou rosto (ou a senha do aparelho, como reserva do sistema).
// Devolve true se a pessoa confirmou, ou se não dá para pedir: na web, sem sensor ou sem biometria cadastrada.
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export async function confirmarBiometria(mensagem: string): Promise<boolean> {
  // 1) No navegador não existe biometria: libera direto.
  if (Platform.OS === 'web') {
    return true;
  }

  // 2) O aparelho precisa ter o sensor e a pessoa precisa ter cadastrado digital ou rosto.
  const temSensor = await LocalAuthentication.hasHardwareAsync();
  const temBiometriaCadastrada = await LocalAuthentication.isEnrolledAsync();
  if (!temSensor || !temBiometriaCadastrada) {
    return true; // sem biometria, libera para não trancar a pessoa
  }

  // 3) Pede a biometria e devolve se deu certo.
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: mensagem,
    cancelLabel: 'Cancelar',
  });
  return resultado.success;
}
