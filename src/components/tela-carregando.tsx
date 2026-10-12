import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { NOME_APP } from '@/constants/app';
import { cores } from '@/constants/cores';

// Tela mostrada com o nome do app enquanto algo está sendo carregado.
export default function TelaCarregando() {
  return (
    <View style={estilos.tela}>
      <Ionicons name="trending-up" size={56} color={cores.destaque} />
      <Text style={estilos.nome}>{NOME_APP}</Text>
      <ActivityIndicator size="small" color={cores.destaque} style={{ marginTop: 20 }} />
      <Text style={estilos.msg}>Buscando informações...</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal, marginTop: 12 },
  msg: { fontSize: 13, color: cores.textoSecundario, marginTop: 10 },
});
