import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Cartao from '@/components/cartao';
import TelaCarregando from '@/components/tela-carregando';
import { NOME_APP } from '@/constants/app';
import { cores, LARGURA_DESKTOP, LARGURA_MAXIMA } from '@/constants/cores';
import { INDICADORES } from '@/constants/indicadores';
import { buscarTudo, Indicador } from '@/services/api';
import { lerCache, salvarCache } from '@/services/cache';
import { adicionarFavorito, Favorito, listarFavoritos, removerFavorito } from '@/services/favoritos';

export default function Painel() {
  const { width } = useWindowDimensions();
  const desktop = width >= LARGURA_DESKTOP;

  const [lista, setLista] = useState<Indicador[]>([]);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semConexao, setSemConexao] = useState(false);
  const [hora, setHora] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const novos = await buscarTudo();
    const salvo = await lerCache();

    // O que não veio da internet é completado com o que estava salvo (modo offline).
    const juntos = [...novos, ...(salvo?.lista ?? [])];
    const completa = INDICADORES.map((m) => juntos.find((i) => i.chave === m.chave)).filter(
      (i): i is Indicador => i !== undefined,
    );

    setSemConexao(novos.length < INDICADORES.length);
    if (novos.length > 0) {
      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      await salvarCache({ hora: agora, lista: completa });
      setHora(agora);
    } else {
      setHora(salvo?.hora ?? null);
    }
    setLista(completa);
    setCarregando(false);
  }

  async function carregarFavoritos() {
    try {
      setFavoritos(await listarFavoritos());
    } catch {
      setErro('Não foi possível carregar os favoritos.');
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Recarrega os favoritos toda vez que a aba é aberta.
  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, []),
  );

  async function alternarFavorito(chave: string) {
    setErro('');
    try {
      const existente = favoritos.find((f) => f.indicador === chave);
      if (existente) await removerFavorito(existente.id);
      else await adicionarFavorito(chave);
      setFavoritos(await listarFavoritos());
    } catch {
      setErro('Não foi possível atualizar os favoritos.');
    }
  }

  if (carregando && lista.length === 0) return <TelaCarregando />;

  // Quantos cartões cabem por linha: no desktop são mais colunas.
  const largura = (grupo: string) => (grupo === 'Economia' ? (desktop ? '24%' : '48.5%') : desktop ? '49%' : '100%');

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregar} tintColor={cores.destaque} />
        }>
        <View style={[estilos.centro, desktop && { paddingTop: 24 }]}>
          <Text style={estilos.titulo}>{NOME_APP}</Text>
          <Text style={estilos.subtitulo}>{hora ? `Atualizado às ${hora}` : 'Sem dados'}</Text>

          {semConexao && (
            <Text style={estilos.aviso}>Sem conexão com alguma fonte. Mostrando os últimos dados salvos.</Text>
          )}
          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

          {(['Economia', 'Criptomoedas'] as const).map((grupo) => (
            <View key={grupo}>
              <Text style={estilos.secao}>{grupo}</Text>
              <View style={estilos.grade}>
                {lista
                  .filter((i) => i.grupo === grupo)
                  .map((indicador, posicao) => (
                    <Cartao
                      key={indicador.chave}
                      indicador={indicador}
                      favorito={favoritos.some((f) => f.indicador === indicador.chave)}
                      onFavoritar={() => alternarFavorito(indicador.chave)}
                      atraso={posicao * 80}
                      largura={largura(grupo)}
                    />
                  ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { alignItems: 'center', paddingBottom: 40 },
  centro: { width: '100%', maxWidth: LARGURA_MAXIMA, paddingHorizontal: 20, paddingTop: 12 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal },
  subtitulo: { fontSize: 13, color: cores.textoSecundario, marginTop: 4 },
  secao: { fontSize: 16, fontWeight: '700', color: cores.destaque, marginTop: 28, marginBottom: 12 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  aviso: { color: cores.destaque, backgroundColor: cores.destaqueFundo, padding: 12, borderRadius: 12, marginTop: 16 },
  erro: { color: cores.negativo, backgroundColor: cores.negativoFundo, padding: 12, borderRadius: 12, marginTop: 16 },
});
