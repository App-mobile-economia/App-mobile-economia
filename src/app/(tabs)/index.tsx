import { useNetworkState } from 'expo-network';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Cartao from '@/components/cartao';
import TelaCarregando from '@/components/tela-carregando';
import { NOME_APP } from '@/constants/app';
import { cores, LARGURA_DESKTOP, LARGURA_MAXIMA } from '@/constants/cores';
import { INDICADORES } from '@/constants/indicadores';
import { buscarTudo, Indicador } from '@/services/api';
import { buscarMoedas, indicadoresDeMoedas, normalizar } from '@/services/busca';
import { lerCache, salvarCache } from '@/services/cache';
import { useSacudir } from '@/hooks/use-sacudir';
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
  const [busca, setBusca] = useState('');
  const [achadas, setAchadas] = useState<Indicador[]>([]); // moedas achadas na busca

  // Busca os dados (a tela já começa com carregando = true).
  async function carregar() {
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

  // Usada ao puxar a tela para atualizar ou ao sacudir o celular.
  async function atualizar() {
    setCarregando(true);
    await carregar();
  }

  // Sacudir o celular também atualiza os indicadores.
  useSacudir(atualizar);

  // Sensor de rede: avisa quando está offline e atualiza sozinho quando a internet volta.
  const rede = useNetworkState();
  const offline = rede.isConnected === false || rede.isInternetReachable === false;
  const estavaOffline = useRef(false);
  useEffect(() => {
    if (estavaOffline.current && !offline) {
      atualizar();
    }
    estavaOffline.current = offline;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  async function carregarFavoritos() {
    try {
      setFavoritos(await listarFavoritos());
    } catch {
      setErro('Não foi possível carregar os favoritos.');
    }
  }

  // Carrega os dados quando a tela abre. Os setState de carregar() só rodam depois do await.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  // Recarrega os favoritos toda vez que a aba é aberta.
  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, []),
  );

  // Busca moedas pelo nome, esperando a pessoa parar de digitar (a CoinGecko limita as chamadas).
  useEffect(() => {
    const texto = busca.trim();
    if (texto.length < 2) return;
    let ativo = true;
    const espera = setTimeout(async () => {
      try {
        const itens = await indicadoresDeMoedas(await buscarMoedas(texto));
        if (ativo) setAchadas(itens);
      } catch {
        if (ativo) setAchadas([]);
      }
    }, 500);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [busca]);

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

  // Com 2+ letras digitadas, mostra só o que combina (título, palavras-chave ou grupo).
  const texto = normalizar(busca);
  const buscando = texto.length >= 2;
  const visiveis = buscando
    ? lista.filter((i) => normalizar(`${i.titulo} ${i.palavras ?? ''} ${i.grupo}`).includes(texto))
    : lista;
  // Moedas da busca que ainda não estão no painel.
  const outrasMoedas = buscando ? achadas.filter((a) => !lista.some((i) => i.idCripto === a.idCripto)) : [];

  // Quantos cartões cabem por linha: no desktop são mais colunas.
  const largura = (grupo: string) => (grupo === 'Economia' ? (desktop ? '24%' : '48.5%') : desktop ? '49%' : '100%');

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={cores.destaque} />
        }>
        <View style={[estilos.centro, desktop && { paddingTop: 24 }]}>
          <Text style={estilos.titulo}>{NOME_APP}</Text>
          <Text style={estilos.subtitulo}>{hora ? `Atualizado às ${hora}` : 'Sem dados'}</Text>

          {offline ? (
            <Text style={estilos.aviso}>
              Você está offline. Mostrando dados do cache{hora ? ` (atualizados às ${hora})` : ''}.
            </Text>
          ) : (
            semConexao && (
              <Text style={estilos.aviso}>Sem conexão com alguma fonte. Mostrando os últimos dados salvos.</Text>
            )
          )}
          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

          <View style={estilos.busca}>
            <Ionicons name="search" size={18} color={cores.textoSecundario} />
            <TextInput
              style={estilos.campoBusca}
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar indicador ou moeda (ex.: inflação, solana)"
              placeholderTextColor={cores.textoSecundario}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Buscar indicador ou moeda"
            />
          </View>

          {buscando && visiveis.length === 0 && outrasMoedas.length === 0 && (
            <Text style={estilos.vazio}>Nada encontrado para &quot;{busca.trim()}&quot;.</Text>
          )}

          {(['Economia', 'Criptomoedas'] as const).map((grupo) => {
            const doGrupo = visiveis.filter((i) => i.grupo === grupo);
            if (doGrupo.length === 0) return null;
            return (
              <View key={grupo}>
                <Text style={estilos.secao}>{grupo}</Text>
                <View style={estilos.grade}>
                  {doGrupo.map((indicador, posicao) => (
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
            );
          })}

          {outrasMoedas.length > 0 && (
            <View>
              <Text style={estilos.secao}>Outras criptomoedas</Text>
              <View style={estilos.grade}>
                {outrasMoedas.map((indicador, posicao) => (
                  <Cartao
                    key={indicador.chave}
                    indicador={indicador}
                    favorito={favoritos.some((f) => f.indicador === indicador.chave)}
                    onFavoritar={() => alternarFavorito(indicador.chave)}
                    atraso={posicao * 80}
                    largura={largura('Criptomoedas')}
                  />
                ))}
              </View>
            </View>
          )}
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
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.card,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  campoBusca: { flex: 1, color: cores.textoPrincipal, paddingVertical: 12 },
  vazio: { color: cores.textoSecundario, marginTop: 24 },
  aviso: { color: cores.destaque, backgroundColor: cores.destaqueFundo, padding: 12, borderRadius: 12, marginTop: 16 },
  erro: { color: cores.negativo, backgroundColor: cores.negativoFundo, padding: 12, borderRadius: 12, marginTop: 16 },
});
