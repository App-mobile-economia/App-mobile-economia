import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '@/constants/cores';
import { Indicador } from '@/services/api';
import { formatarPercentual } from '@/utils/formatadores';

type Props = {
  indicador: Indicador;
  favorito: boolean;
  onFavoritar: () => void;
  atraso: number; // espera (ms) antes da animação, para os cartões entrarem em sequência
  largura: `${number}%`;
};

export default function Cartao({ indicador, favorito, onFavoritar, atraso, largura }: Props) {
  // Animação de entrada: o cartão aparece (opacidade) e sobe um pouco.
  const [entrada] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(entrada, { toValue: 1, duration: 500, delay: atraso, useNativeDriver: true }).start();
  }, [entrada, atraso]);

  const { titulo, icone, valor, detalhe, variacao } = indicador;
  const subiu = (variacao ?? 0) >= 0;

  return (
    <Animated.View
      style={[
        estilos.card,
        {
          width: largura,
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}>
      <View style={estilos.topo}>
        <View style={estilos.icone}>
          <Ionicons name={icone} size={20} color={cores.destaque} />
        </View>
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        <Pressable
          onPress={onFavoritar}
          accessibilityRole="button"
          accessibilityLabel={favorito ? `Remover ${titulo} dos favoritos` : `Favoritar ${titulo}`}>
          <Ionicons name={favorito ? 'star' : 'star-outline'} size={22} color={cores.destaque} />
        </Pressable>
      </View>

      <Text style={estilos.valor}>{valor}</Text>

      {typeof variacao === 'number' && (
        <View style={[estilos.etiqueta, { backgroundColor: subiu ? cores.positivoFundo : cores.negativoFundo }]}>
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
