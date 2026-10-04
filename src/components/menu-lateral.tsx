import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import BotaoAtualizar from '@/components/botao-atualizar';
import { NOME_APP } from '@/constants/app';
import { cores } from '@/constants/cores';

type Props = { carregando: boolean; atualizadoEm: string | null; onAtualizar: () => void };

const itens: { icone: keyof typeof Ionicons.glyphMap; nome: string; ativo?: boolean }[] = [
  { icone: 'speedometer', nome: 'Visão geral', ativo: true },
  { icone: 'stats-chart', nome: 'Economia' },
  { icone: 'logo-bitcoin', nome: 'Criptomoedas' },
];

// Menu lateral exibido apenas no layout de desktop.
export default function MenuLateral({ carregando, atualizadoEm, onAtualizar }: Props) {
  return (
    <View style={estilos.lateral}>
      <View style={estilos.marca}>
        <Ionicons name="trending-up" size={26} color={cores.destaque} />
        <Text style={estilos.nomeMarca}>{NOME_APP}</Text>
      </View>

      <View style={{ gap: 6 }}>
        {itens.map((item) => (
          <View key={item.nome} style={[estilos.item, item.ativo && estilos.itemAtivo]}>
            <Ionicons name={item.icone} size={18} color={item.ativo ? cores.destaque : cores.textoSecundario} />
            <Text style={[estilos.textoItem, item.ativo && { color: cores.textoPrincipal }]}>{item.nome}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 'auto', gap: 12 }}>
        <BotaoAtualizar carregando={carregando} onPress={onAtualizar} />
        <Text style={estilos.atualizado}>
          {atualizadoEm ? `Atualizado às ${atualizadoEm}` : 'Buscando dados...'}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  lateral: {
    width: 240,
    backgroundColor: cores.fundoLateral,
    borderRightWidth: 1,
    borderRightColor: cores.borda,
    padding: 24,
    gap: 32,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nomeMarca: { fontSize: 20, fontWeight: '800', color: cores.textoPrincipal },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10 },
  itemAtivo: { backgroundColor: cores.card },
  textoItem: { fontSize: 14, color: cores.textoSecundario, fontWeight: '600' },
  atualizado: { fontSize: 12, color: cores.textoSecundario, textAlign: 'center' },
});
