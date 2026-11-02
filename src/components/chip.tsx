// Botão arredondado usado nos filtros (período, grupo).
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '@/constants/cores';

type Props = {
  texto: string; // o que aparece escrito no botão
  ativo: boolean; // true = é o filtro escolhido (fica amarelo)
  onPress: () => void; // função chamada ao tocar
};

export default function Chip({ texto, ativo, onPress }: Props) {
  // Estilos do botão e do texto: o escolhido recebe o estilo "ativo" por cima.
  const estiloDoBotao: object[] = [estilos.chip];
  const estiloDoTexto: object[] = [estilos.texto];
  if (ativo) {
    estiloDoBotao.push(estilos.chipAtivo);
    estiloDoTexto.push(estilos.textoAtivo);
  }

  return (
    <Pressable onPress={onPress} style={estiloDoBotao} accessibilityRole="button" accessibilityState={{ selected: ativo }}>
      <Text style={estiloDoTexto}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: { borderColor: cores.borda, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  texto: { color: cores.textoSecundario, fontSize: 13, fontWeight: '600' },
  textoAtivo: { color: cores.fundo },
});
