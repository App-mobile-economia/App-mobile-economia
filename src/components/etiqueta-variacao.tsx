// Etiqueta verde (subiu) ou vermelha (caiu) com seta e texto. Usada no cartão e nos favoritos.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '@/constants/cores';

type Props = {
  subiu: boolean; // true = verde com seta para cima; false = vermelha com seta para baixo
  texto: string;
};

export default function EtiquetaVariacao({ subiu, texto }: Props) {
  // Escolhe as cores e a seta conforme o valor subiu ou caiu.
  let corDoTexto: string = cores.negativo;
  let corDeFundo: string = cores.negativoFundo;
  let nomeDaSeta: 'trending-up' | 'trending-down' = 'trending-down';
  if (subiu) {
    corDoTexto = cores.positivo;
    corDeFundo = cores.positivoFundo;
    nomeDaSeta = 'trending-up';
  }

  return (
    <View style={[estilos.etiqueta, { backgroundColor: corDeFundo }]}>
      <Ionicons name={nomeDaSeta} size={14} color={corDoTexto} />
      <Text style={{ color: corDoTexto, fontWeight: '600', fontSize: 13 }}>{texto}</Text>
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
