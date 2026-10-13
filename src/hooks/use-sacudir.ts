// Chama "aoSacudir" quando o celular é sacudido (acelerômetro).
// No navegador o sensor não é usado; lá continua valendo puxar a tela para atualizar.
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const FORCA_MINIMA = 1.8; // em "g": parado fica perto de 1, uma sacudida passa de 1.8
const INTERVALO_ENTRE_SACUDIDAS = 1500; // evita atualizar várias vezes seguidas

export function useSacudir(aoSacudir: () => void) {
  // Guarda a função mais recente sem precisar reassinar o sensor a cada render.
  const funcao = useRef(aoSacudir);
  useEffect(() => {
    funcao.current = aoSacudir;
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let assinatura: { remove: () => void } | undefined;
    let ultima = 0;
    let ativo = true;

    Accelerometer.isAvailableAsync().then((disponivel) => {
      if (!disponivel || !ativo) return;
      Accelerometer.setUpdateInterval(100);
      assinatura = Accelerometer.addListener(({ x, y, z }) => {
        const forca = Math.sqrt(x * x + y * y + z * z);
        const agora = Date.now();
        if (forca > FORCA_MINIMA && agora - ultima > INTERVALO_ENTRE_SACUDIDAS) {
          ultima = agora;
          funcao.current();
        }
      });
    });

    return () => {
      ativo = false;
      assinatura?.remove();
    };
  }, []);
}
