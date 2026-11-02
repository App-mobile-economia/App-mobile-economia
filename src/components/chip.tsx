// Botão arredondado usado nos filtros (período, grupo).
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '@/constants/cores';

type Props = { texto: string; ativo: boolean; onPress: () => void };

export default function Chip({ texto, ativo, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[estilos.chip, ativo && estilos.ativo]}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}>
      <Text style={[estilos.texto, ativo && estilos.textoAtivo]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: { borderColor: cores.borda, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  ativo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  texto: { color: cores.textoSecundario, fontSize: 13, fontWeight: '600' },
  textoAtivo: { color: cores.fundo },
});
