// Etiqueta verde (subiu) ou vermelha (caiu) com seta e texto. Usada no cartão e nos favoritos.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '@/constants/cores';

type Props = { subiu: boolean; texto: string };

export default function EtiquetaVariacao({ subiu, texto }: Props) {
  const cor = subiu ? cores.positivo : cores.negativo;
  return (
    <View style={[estilos.etiqueta, { backgroundColor: subiu ? cores.positivoFundo : cores.negativoFundo }]}>
      <Ionicons name={subiu ? 'trending-up' : 'trending-down'} size={14} color={cor} />
      <Text style={{ color: cor, fontWeight: '600', fontSize: 13 }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
