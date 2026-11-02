// Cartão de um indicador: ícone, título, valor, variação e estrela de favorito.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, DimensionValue, Pressable, StyleSheet, Text, View } from 'react-native';

import EtiquetaVariacao from '@/components/etiqueta-variacao';
import { cores } from '@/constants/cores';
import { Indicador } from '@/services/api';
import { formatarPercentual } from '@/utils/formatadores';

type Props = {
  indicador: Indicador;
  favorito: boolean; // true = a estrela aparece preenchida
  onFavoritar: () => void; // função chamada ao tocar na estrela
  atraso: number; // espera (em ms) antes da animação, para os cartões entrarem um depois do outro
  largura: DimensionValue; // ex.: '48.5%'
  compacto?: boolean; // celular com 2 cartões por linha: título em linha própria e valor menor
};

export default function Cartao({ indicador, favorito, onFavoritar, atraso, largura, compacto = false }: Props) {
  // Animação de entrada: o cartão aparece aos poucos e sobe um pouco.
  // "entrada" vai de 0 (começo) até 1 (fim da animação).
  const [entrada] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(entrada, { toValue: 1, duration: 500, delay: atraso, useNativeDriver: true }).start();
  }, [entrada, atraso]);

  // Enquanto "entrada" vai de 0 a 1, o cartão sobe de 24 pixels abaixo até a posição final.
  const subida = entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  const { titulo, icone, valor, detalhe, variacao } = indicador;
  const temVariacao = typeof variacao === 'number';
  const subiu = (variacao ?? 0) >= 0;

  // Texto lido por leitores de tela no botão da estrela.
  let textoDaEstrela = 'Favoritar ' + titulo;
  if (favorito) {
    textoDaEstrela = 'Remover ' + titulo + ' dos favoritos';
  }

  return (
    <Animated.View style={[estilos.card, { width: largura, opacity: entrada, transform: [{ translateY: subida }] }]}>
      {/* Linha de cima: ícone, título (só no modo normal) e estrela */}
      <View style={estilos.topo}>
        <View style={estilos.icone}>
          <Ionicons name={icone} size={20} color={cores.destaque} />
        </View>

        {compacto ? (
          <View style={estilos.espaco} />
        ) : (
          <Text style={estilos.titulo} numberOfLines={1}>
            {titulo}
          </Text>
        )}

        <Pressable onPress={onFavoritar} accessibilityRole="button" accessibilityLabel={textoDaEstrela}>
          <Ionicons name={favorito ? 'star' : 'star-outline'} size={22} color={cores.destaque} />
        </Pressable>
      </View>

      {/* No modo compacto o título fica numa linha própria, abaixo do ícone */}
      {compacto ? (
        <Text style={estilos.tituloCompacto} numberOfLines={2}>
          {titulo}
        </Text>
      ) : null}

      <Text
        style={[estilos.valor, compacto && estilos.valorCompacto]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {valor}
      </Text>

      {/* Só as criptomoedas têm variação das últimas 24 horas */}
      {temVariacao ? (
        <View style={estilos.variacao}>
          <EtiquetaVariacao subiu={subiu} texto={formatarPercentual(Math.abs(variacao)) + ' em 24h'} />
        </View>
      ) : null}

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
    padding: 14,
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
  espaco: { flex: 1 },
  titulo: { flex: 1, fontSize: 13, color: cores.textoSecundario },
  tituloCompacto: { fontSize: 13, color: cores.textoSecundario, marginTop: 10 },
  valor: { fontSize: 26, fontWeight: '700', color: cores.textoPrincipal, marginTop: 12 },
  valorCompacto: { fontSize: 20, marginTop: 6 },
  detalhe: { fontSize: 12, color: cores.textoSecundario, marginTop: 8 },
  variacao: { marginTop: 8 },
});
