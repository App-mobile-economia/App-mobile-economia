import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProtegidoPorBiometria from '@/components/protegido-por-biometria';
import { cores, LARGURA_MAXIMA } from '@/constants/cores';
import { metaDaChave } from '@/constants/indicadores';
import { atualizarNota, Favorito, listarFavoritos, removerFavorito } from '@/services/favoritos';
import { buscarResumo, buscarResumosCripto, formatarValor, formatarVariacao, PERIODOS, Resumo } from '@/services/historico';

const GRUPOS = ['Todos', 'Economia', 'Criptomoedas'] as const;
type Historico = Record<string, Resumo | null | 'erro'>;

// A aba só abre depois da digital ou do rosto.
export default function Favoritos() {
  return (
    <ProtegidoPorBiometria>
      <ListaFavoritos />
    </ProtegidoPorBiometria>
  );
}

function ListaFavoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [erro, setErro] = useState('');
  const [periodo, setPeriodo] = useState('30d');
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]>('Todos');
  // Guarda de qual período são os dados, para mostrar "carregando" ao trocar de período.
  const [historico, setHistorico] = useState<{ periodo: string; dados: Historico } | null>(null);

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

  // Busca o histórico dos favoritos quando a lista ou o período mudam.
  const chaves = favoritos.map((f) => f.indicador).join(',');
  useEffect(() => {
    if (!chaves) return;
    let ativo = true;
    const dias = PERIODOS.find((p) => p.chave === periodo)?.dias ?? 30;
    const metas = chaves.split(',').map(metaDaChave);
    // Moedas: uma chamada só para todas (a CoinGecko limita as chamadas).
    const ids = metas.flatMap((m) => (m.idCripto ? [m.idCripto] : []));
    const moedas = ids.length > 0 ? buscarResumosCripto(ids, dias).catch(() => null) : null;

    Promise.all(
      metas.map(async (meta) => {
        try {
          if (meta.idCripto) {
            const resumos = await moedas;
            return [meta.chave, resumos ? (resumos[meta.idCripto] ?? null) : 'erro'] as const;
          }
          return [meta.chave, await buscarResumo(meta, dias)] as const;
        } catch {
          return [meta.chave, 'erro'] as const;
        }
      }),
    ).then((pares) => {
      if (ativo) setHistorico({ periodo, dados: Object.fromEntries(pares) });
    });
    return () => {
      ativo = false;
    };
  }, [chaves, periodo]);

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

          <View style={estilos.filtros}>
            {PERIODOS.map((p) => (
              <Pressable
                key={p.chave}
                onPress={() => setPeriodo(p.chave)}
                style={[estilos.chip, periodo === p.chave && estilos.chipAtivo]}
                accessibilityRole="button"
                accessibilityState={{ selected: periodo === p.chave }}>
                <Text style={[estilos.chipTexto, periodo === p.chave && estilos.chipTextoAtivo]}>{p.titulo}</Text>
              </Pressable>
            ))}
          </View>
          <View style={estilos.filtros}>
            {GRUPOS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGrupo(g)}
                style={[estilos.chip, grupo === g && estilos.chipAtivo]}
                accessibilityRole="button"
                accessibilityState={{ selected: grupo === g }}>
                <Text style={[estilos.chipTexto, grupo === g && estilos.chipTextoAtivo]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          {favoritos.length === 0 && !erro && (
            <Text style={estilos.vazio}>Nenhum favorito ainda. Toque na estrela de um cartão no Painel.</Text>
          )}

          {favoritos
            .filter((f) => grupo === 'Todos' || metaDaChave(f.indicador).grupo === grupo)
            .map((favorito) => {
            const meta = metaDaChave(favorito.indicador);
            const resumo = historico?.periodo === periodo ? historico.dados[favorito.indicador] : undefined;
            return (
              <View key={favorito.id} style={estilos.item}>
                <View style={estilos.linha}>
                  <Ionicons name={meta.icone} size={20} color={cores.destaque} />
                  <Text style={estilos.nome}>{meta.titulo}</Text>
                  <Pressable
                    onPress={() => apagar(favorito.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${meta.titulo}`}>
                    <Ionicons name="trash" size={20} color={cores.negativo} />
                  </Pressable>
                </View>
                <Text style={estilos.historico}>
                  {resumo === undefined && 'Carregando histórico...'}
                  {resumo === 'erro' && 'Não foi possível carregar o histórico.'}
                  {resumo === null && 'Sem dados neste período (este indicador é atualizado com pouca frequência).'}
                  {resumo && resumo !== 'erro' && (
                    <>
                      Variação {formatarVariacao(meta, resumo)} · De {formatarValor(meta, resumo.inicio)} para{' '}
                      {formatarValor(meta, resumo.fim)}
                      {resumo.minimo !== undefined && resumo.maximo !== undefined
                        ? ` · Mín ${formatarValor(meta, resumo.minimo)} · Máx ${formatarValor(meta, resumo.maximo)}`
                        : ''}
                    </>
                  )}
                </Text>
                <TextInput
                  style={estilos.campo}
                  defaultValue={favorito.nota}
                  placeholder="Escreva uma nota..."
                  placeholderTextColor={cores.textoSecundario}
                  onEndEditing={(e) => salvarNota(favorito.id, e.nativeEvent.text)}
                  accessibilityLabel={`Nota sobre ${meta.titulo}`}
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
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderColor: cores.borda, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  chipTexto: { color: cores.textoSecundario, fontSize: 13, fontWeight: '600' },
  chipTextoAtivo: { color: cores.fundo },
  historico: { color: cores.textoSecundario, fontSize: 12 },
  campo: {
    backgroundColor: cores.fundo,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: cores.textoPrincipal,
  },
});
