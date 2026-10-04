import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { NOME_APP, SLOGAN_APP } from '@/constants/app';
import { cores } from '@/constants/cores';

// Exibida em tela cheia enquanto os primeiros dados são buscados.
export default function TelaCarregando() {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  return (
    <View style={estilos.tela}>
      <Animated.View
        style={[
          estilos.logo,
          { transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] },
        ]}>
        <Ionicons name="trending-up" size={44} color={cores.destaque} />
      </Animated.View>
      <Text style={estilos.nome}>{NOME_APP}</Text>
      <Text style={estilos.slogan}>{SLOGAN_APP}</Text>
      <ActivityIndicator size="small" color={cores.destaque} style={{ marginTop: 28 }} />
      <Text style={estilos.msg}>Buscando informações...</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: cores.destaqueFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal, marginTop: 20 },
  slogan: { fontSize: 14, color: cores.textoSecundario, marginTop: 6, textAlign: 'center' },
  msg: { fontSize: 13, color: cores.textoSecundario, marginTop: 10 },
});
