import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores, LARGURA_MAXIMA } from '@/constants/cores';
import { INDICADORES } from '@/constants/indicadores';
import { atualizarNota, Favorito, listarFavoritos, removerFavorito } from '@/services/favoritos';

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [erro, setErro] = useState('');

  async function carregar() {
    try {
      setFavoritos(await listarFavoritos());
      setErro('');
    } catch {
      setErro('Não foi possível carregar os favoritos.');
    }
  }

  // Carrega a lista toda vez que a aba é aberta.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, []),
  );

  async function salvarNota(id: number, nota: string) {
    try {
      await atualizarNota(id, nota);
    } catch {
      setErro('Não foi possível salvar a nota.');
    }
  }

  async function apagar(id: number) {
    try {
      await removerFavorito(id);
      await carregar();
    } catch {
      setErro('Não foi possível remover o favorito.');
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.centro}>
          <Text style={estilos.titulo}>Favoritos</Text>
          <Text style={estilos.subtitulo}>Escreva uma nota e saia do campo para salvar.</Text>

          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

          {favoritos.length === 0 && !erro && (
            <Text style={estilos.vazio}>Nenhum favorito ainda. Toque na estrela de um cartão no Painel.</Text>
          )}

          {favoritos.map((favorito) => {
            const meta = INDICADORES.find((i) => i.chave === favorito.indicador);
            return (
              <View key={favorito.id} style={estilos.item}>
                <View style={estilos.linha}>
                  <Ionicons name={meta?.icone ?? 'star'} size={20} color={cores.destaque} />
                  <Text style={estilos.nome}>{meta?.titulo ?? favorito.indicador}</Text>
                  <Pressable
                    onPress={() => apagar(favorito.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${meta?.titulo ?? 'favorito'}`}>
                    <Ionicons name="trash" size={20} color={cores.negativo} />
                  </Pressable>
                </View>
                <TextInput
                  style={estilos.campo}
                  defaultValue={favorito.nota}
                  placeholder="Escreva uma nota..."
                  placeholderTextColor={cores.textoSecundario}
                  onEndEditing={(e) => salvarNota(favorito.id, e.nativeEvent.text)}
                  accessibilityLabel={`Nota sobre ${meta?.titulo ?? 'favorito'}`}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { alignItems: 'center', paddingBottom: 40 },
  centro: { width: '100%', maxWidth: LARGURA_MAXIMA, paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal },
  subtitulo: { fontSize: 13, color: cores.textoSecundario },
  vazio: { color: cores.textoSecundario, marginTop: 24 },
  erro: { color: cores.negativo, backgroundColor: cores.negativoFundo, padding: 12, borderRadius: 12 },
  item: { backgroundColor: cores.card, borderColor: cores.borda, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nome: { flex: 1, color: cores.textoPrincipal, fontSize: 16, fontWeight: '600' },
  campo: {
    backgroundColor: cores.fundo,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: cores.textoPrincipal,
  },
});
