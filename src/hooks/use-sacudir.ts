// Chama "aoSacudir" quando o celular é sacudido (acelerômetro).
// No navegador o sensor não é usado; lá continua valendo puxar a tela para atualizar.
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Parado, o acelerômetro marca perto de 1 (a gravidade). Uma sacudida passa de 1,8.
const FORCA_MINIMA = 1.8;
// Espera (em milissegundos) entre uma sacudida e a próxima, para não atualizar várias vezes seguidas.
const ESPERA_ENTRE_SACUDIDAS = 1500;

export function useSacudir(aoSacudir: () => void) {
  // A função recebida muda a cada renderização. Guardamos a mais recente aqui,
  // assim o sensor é ligado uma vez só e sempre chama a versão atual.
  const funcaoAtual = useRef(aoSacudir);
  useEffect(() => {
    funcaoAtual.current = aoSacudir;
  });

  useEffect(() => {
    // No navegador não usamos o sensor.
    if (Platform.OS === 'web') return;

    let assinatura: { remove: () => void } | undefined;
    let horaDaUltimaSacudida = 0;
    let tela = true; // vira false quando a tela é fechada

    async function ligarSensor() {
      const disponivel = await Accelerometer.isAvailableAsync();
      if (!disponivel || !tela) return;

      Accelerometer.setUpdateInterval(100); // lê o sensor a cada 100 ms
      assinatura = Accelerometer.addListener(({ x, y, z }) => {
        // Força total do movimento nos três eixos.
        const forca = Math.sqrt(x * x + y * y + z * z);
        const agora = Date.now();
        const passouOTempo = agora - horaDaUltimaSacudida > ESPERA_ENTRE_SACUDIDAS;

        if (forca > FORCA_MINIMA && passouOTempo) {
          horaDaUltimaSacudida = agora;
          funcaoAtual.current();
        }
      });
    }
    ligarSensor();

    // Ao fechar a tela, desliga o sensor.
    return () => {
      tela = false;
      assinatura?.remove();
    };
  }, []);
}
