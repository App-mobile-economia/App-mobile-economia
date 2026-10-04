import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '@/constants/cores';
import { formatarPercentual } from '@/utils/formatadores';

type Props = {
  titulo: string;
  valor: string;
  icone: keyof typeof Ionicons.glyphMap;
  detalhe?: string;
  variacao?: number;
  atraso?: number;
  largura?: `${number}%`;
};

export default function Cartao({ titulo, valor, icone, detalhe, variacao, atraso = 0, largura }: Props) {
  const entrada = useRef(new Animated.Value(0)).current;
  const [sobre, setSobre] = useState(false);

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 500,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada, atraso]);

  const subiu = (variacao ?? 0) >= 0;

  return (
    <Animated.View
      style={{
        width: largura,
        opacity: entrada,
        transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}>
      <Pressable
        onHoverIn={() => setSobre(true)}
        onHoverOut={() => setSobre(false)}
        style={({ pressed }) => [
          estilos.card,
          sobre && estilos.sobre,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}>
        <View style={estilos.topo}>
          <View style={estilos.icone}>
            <Ionicons name={icone} size={20} color={cores.destaque} />
          </View>
          <Text style={estilos.titulo} numberOfLines={1}>
            {titulo}
          </Text>
        </View>
        <Text style={estilos.valor} adjustsFontSizeToFit numberOfLines={1}>
          {valor}
        </Text>

        {typeof variacao === 'number' && (
          <View
            style={[
              estilos.etiqueta,
              { backgroundColor: subiu ? cores.positivoFundo : cores.negativoFundo },
            ]}>
            <Ionicons
              name={subiu ? 'trending-up' : 'trending-down'}
              size={14}
              color={subiu ? cores.positivo : cores.negativo}
            />
            <Text style={{ color: subiu ? cores.positivo : cores.negativo, fontWeight: '600', fontSize: 13 }}>
              {formatarPercentual(Math.abs(variacao))} em 24h
            </Text>
          </View>
        )}

        {detalhe ? <Text style={estilos.detalhe}>{detalhe}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: cores.card,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sobre: { backgroundColor: cores.cardHover, borderColor: cores.destaque },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: cores.destaqueFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { flex: 1, fontSize: 13, color: cores.textoSecundario },
  valor: { fontSize: 26, fontWeight: '700', color: cores.textoPrincipal, marginTop: 12 },
  detalhe: { fontSize: 12, color: cores.textoSecundario, marginTop: 8 },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
});
