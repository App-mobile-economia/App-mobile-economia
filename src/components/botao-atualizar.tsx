import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '@/constants/cores';

type Props = { carregando: boolean; onPress: () => void; compacto?: boolean };

export default function BotaoAtualizar({ carregando, onPress, compacto }: Props) {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!carregando) {
      giro.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [carregando, giro]);

  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      accessibilityRole="button"
      accessibilityLabel="Atualizar dados"
      style={({ pressed }) => [estilos.botao, pressed && { opacity: 0.7 }]}>
      <Animated.View
        style={{ transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <Ionicons name="refresh" size={18} color={cores.fundo} />
      </Animated.View>
      {!compacto && <Text style={estilos.texto}>{carregando ? 'Atualizando...' : 'Atualizar'}</Text>}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: cores.destaque,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  texto: { color: cores.fundo, fontWeight: '700', fontSize: 14 },
});
