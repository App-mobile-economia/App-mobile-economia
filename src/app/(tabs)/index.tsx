// Tela principal (Painel): mostra os indicadores, com busca e filtros.
import { Ionicons } from '@expo/vector-icons';
import { useNetworkState } from 'expo-network';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Cartao from '@/components/cartao';
import Chip from '@/components/chip';
import TelaCarregando from '@/components/tela-carregando';
import { NOME_APP } from '@/constants/app';
import { cores, LARGURA_DESKTOP, LARGURA_MAXIMA } from '@/constants/cores';
import { FILTROS_GRUPO, FiltroGrupo, Grupo, INDICADORES } from '@/constants/indicadores';
import { useSacudir } from '@/hooks/use-sacudir';
import { buscarTudo, Indicador } from '@/services/api';
import { buscarMoedas, indicadoresDeMoedas, normalizar } from '@/services/busca';
import { lerCache, salvarCache } from '@/services/cache';
import { adicionarFavorito, Favorito, listarFavoritos, removerFavorito } from '@/services/favoritos';

export default function Painel() {
  // Largura da tela: define se usamos o layout de celular ou de computador.
  const { width } = useWindowDimensions();
  const desktop = width >= LARGURA_DESKTOP;

  // ---------- Dados guardados pela tela ----------
  const [lista, setLista] = useState<Indicador[]>([]); // indicadores mostrados nos cartões
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semConexao, setSemConexao] = useState(false); // true = alguma fonte falhou
  const [hora, setHora] = useState<string | null>(null); // hora da última atualização
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState(''); // texto digitado na busca
  const [filtro, setFiltro] = useState<FiltroGrupo>('Todos');
  const [moedasAchadas, setMoedasAchadas] = useState<Indicador[]>([]); // moedas achadas na busca

  // ---------- Carregar os indicadores ----------

  // Busca os dados na internet. O que não vier fica com o valor que estava salvo no aparelho.
  async function carregar() {
    const novos = await buscarTudo();
    const salvo = await lerCache();

    // Monta a lista completa, na ordem de INDICADORES.
    const listaCompleta: Indicador[] = [];
    for (const meta of INDICADORES) {
      let item = novos.find((i) => i.chave === meta.chave);
      if (!item && salvo) {
        item = salvo.lista.find((i) => i.chave === meta.chave);
      }
      if (item) {
        listaCompleta.push(item);
      }
    }

    // Se veio menos indicador do que o esperado, alguma fonte está sem conexão.
    setSemConexao(novos.length < INDICADORES.length);

    if (novos.length > 0) {
      // Deu certo: guarda os dados novos e a hora.
      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      await salvarCache({ hora: agora, lista: listaCompleta });
      setHora(agora);
    } else if (salvo) {
      // Nada veio da internet: usa a hora que estava salva.
      setHora(salvo.hora);
    } else {
      setHora(null);
    }

    setLista(listaCompleta);
    setCarregando(false);
  }

  // Usada ao puxar a tela para atualizar ou ao sacudir o celular.
  async function atualizar() {
    setCarregando(true);
    await carregar();
  }

  // Carrega os dados quando a tela abre.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
  }, []);

  // Sacudir o celular também atualiza os indicadores.
  useSacudir(atualizar);

  // ---------- Sensor de rede (offline) ----------

  const rede = useNetworkState();
  const offline = rede.isConnected === false || rede.isInternetReachable === false;

  // Guarda se a tela estava offline na renderização anterior.
  const estavaOffline = useRef(false);

  // Quando a internet volta (estava offline e agora não está), atualiza sozinho.
  useEffect(() => {
    if (estavaOffline.current && !offline) {
      atualizar();
    }
    estavaOffline.current = offline;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  // ---------- Favoritos ----------

  async function carregarFavoritos() {
    try {
      const dados = await listarFavoritos();
      setFavoritos(dados);
    } catch {
      setErro('Não foi possível carregar os favoritos.');
    }
  }

  // Recarrega os favoritos toda vez que a aba é aberta.
  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, []),
  );

  // Toca na estrela: se já é favorito, remove; se não é, adiciona.
  async function alternarFavorito(chave: string) {
    setErro('');
    try {
      const existente = favoritos.find((f) => f.indicador === chave);
      if (existente) {
        await removerFavorito(existente.id);
      } else {
        await adicionarFavorito(chave);
      }
      const dados = await listarFavoritos();
      setFavoritos(dados);
    } catch {
      setErro('Não foi possível atualizar os favoritos.');
    }
  }

  // ---------- Busca de moedas pelo nome ----------

  // Espera a pessoa parar de digitar (meio segundo) antes de buscar, porque a CoinGecko limita as chamadas.
  useEffect(() => {
    const texto = busca.trim();
    if (texto.length < 2) {
      return;
    }

    let telaAindaAberta = true;

    const temporizador = setTimeout(async () => {
      try {
        const moedas = await buscarMoedas(texto);
        const cartoes = await indicadoresDeMoedas(moedas);
        if (telaAindaAberta) {
          setMoedasAchadas(cartoes);
        }
      } catch {
        if (telaAindaAberta) {
          setMoedasAchadas([]);
        }
      }
    }, 500);

    // Se a pessoa digitar de novo antes de 500 ms, cancela a busca anterior.
    return () => {
      telaAindaAberta = false;
      clearTimeout(temporizador);
    };
  }, [busca]);

  // ---------- O que aparece na tela ----------

  const textoDaBusca = normalizar(busca);
  const buscando = textoDaBusca.length >= 2;

  // Com a busca ligada, mostra só os indicadores que combinam (título, palavras-chave ou grupo).
  let indicadoresVisiveis = lista;
  if (buscando) {
    indicadoresVisiveis = lista.filter((indicador) => {
      const textoDoIndicador = normalizar(indicador.titulo + ' ' + (indicador.palavras ?? '') + ' ' + indicador.grupo);
      return textoDoIndicador.includes(textoDaBusca);
    });
  }

  // Durante a busca o filtro de grupo é ignorado, para não esconder o resultado.
  let filtroAtivo = filtro;
  if (buscando) {
    filtroAtivo = 'Todos';
  }

  // Moedas da busca que ainda não estão no painel.
  let outrasMoedas: Indicador[] = [];
  if (buscando) {
    outrasMoedas = moedasAchadas.filter((moeda) => !lista.some((i) => i.idCripto === moeda.idCripto));
  }

  // Largura dos cartões: no celular são 2 por linha; no computador, mais colunas.
  function larguraDoCartao(grupo: Grupo) {
    if (desktop) {
      return grupo === 'Economia' ? '24%' : '49%';
    }
    return '48.5%';
  }

  // Resultados da busca têm texto longo (ranking, mín/máx): no celular ocupam a linha toda.
  const larguraDaBusca = desktop ? '49%' : '100%';

  // Mostra a tela de carregamento só na primeira vez, quando ainda não há nada para mostrar.
  if (carregando && lista.length === 0) {
    return <TelaCarregando />;
  }

  // Monta os cartões de um grupo (Economia ou Criptomoedas).
  function secaoDoGrupo(grupo: Grupo) {
    if (filtroAtivo !== 'Todos' && filtroAtivo !== grupo) {
      return null; // o filtro escondeu este grupo
    }

    const doGrupo = indicadoresVisiveis.filter((i) => i.grupo === grupo);
    if (doGrupo.length === 0) {
      return null; // nada para mostrar neste grupo
    }

    const cartoes = [];
    for (let posicao = 0; posicao < doGrupo.length; posicao++) {
      const indicador = doGrupo[posicao];
      cartoes.push(
        <Cartao
          key={indicador.chave}
          indicador={indicador}
          favorito={favoritos.some((f) => f.indicador === indicador.chave)}
          onFavoritar={() => alternarFavorito(indicador.chave)}
          atraso={posicao * 80}
          largura={larguraDoCartao(grupo)}
          compacto={!desktop}
        />,
      );
    }

    return (
      <View key={grupo}>
        <Text style={estilos.secao}>{grupo}</Text>
        <View style={estilos.grade}>{cartoes}</View>
      </View>
    );
  }

  // Monta os cartões das moedas achadas na busca.
  function secaoDasOutrasMoedas() {
    if (outrasMoedas.length === 0) {
      return null;
    }

    const cartoes = [];
    for (let posicao = 0; posicao < outrasMoedas.length; posicao++) {
      const moeda = outrasMoedas[posicao];
      cartoes.push(
        <Cartao
          key={moeda.chave}
          indicador={moeda}
          favorito={favoritos.some((f) => f.indicador === moeda.chave)}
          onFavoritar={() => alternarFavorito(moeda.chave)}
          atraso={posicao * 80}
          largura={larguraDaBusca}
        />,
      );
    }

    return (
      <View>
        <Text style={estilos.secao}>Outras criptomoedas</Text>
        <View style={estilos.grade}>{cartoes}</View>
      </View>
    );
  }

  // Botões do filtro de grupo.
  const botoesDoFiltro = [];
  for (const nome of FILTROS_GRUPO) {
    botoesDoFiltro.push(<Chip key={nome} texto={nome} ativo={filtro === nome} onPress={() => setFiltro(nome)} />);
  }

  // Avisos no topo da lista.
  let aviso = null;
  if (offline) {
    const horaDoCache = hora ? ' (atualizados às ' + hora + ')' : '';
    aviso = <Text style={estilos.aviso}>Você está offline. Mostrando dados do cache{horaDoCache}.</Text>;
  } else if (semConexao) {
    aviso = <Text style={estilos.aviso}>Sem conexão com alguma fonte. Mostrando os últimos dados salvos.</Text>;
  }

  const nadaEncontrado = buscando && indicadoresVisiveis.length === 0 && outrasMoedas.length === 0;

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      {/* Busca e filtros ficam fixos no topo, fora da rolagem. */}
      <View style={[estilos.centro, estilos.fixo]}>
        <View style={estilos.busca}>
          <Ionicons name="search" size={18} color={cores.textoSecundario} />
          <TextInput
            style={estilos.campoBusca}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar indicador ou moeda"
            placeholderTextColor={cores.textoSecundario}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar indicador ou moeda"
          />
        </View>
        <View style={estilos.filtros}>{botoesDoFiltro}</View>
      </View>

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={cores.destaque} />}>
        <View style={[estilos.centro, desktop && { paddingTop: 24 }]}>
          <Text style={estilos.titulo}>{NOME_APP}</Text>
          <Text style={estilos.subtitulo}>{hora ? 'Atualizado às ' + hora : 'Sem dados'}</Text>

          {aviso}
          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

          {nadaEncontrado ? <Text style={estilos.vazio}>Nada encontrado para &quot;{busca.trim()}&quot;.</Text> : null}

          {secaoDoGrupo('Economia')}
          {secaoDoGrupo('Criptomoedas')}
          {secaoDasOutrasMoedas()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { alignItems: 'center', paddingBottom: 40 },
  centro: { width: '100%', maxWidth: LARGURA_MAXIMA, paddingHorizontal: 20, paddingTop: 12 },
  titulo: { fontSize: 28, fontWeight: '800', color: cores.textoPrincipal },
  subtitulo: { fontSize: 13, color: cores.textoSecundario, marginTop: 4 },
  secao: { fontSize: 16, fontWeight: '700', color: cores.destaque, marginTop: 28, marginBottom: 12 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  fixo: { alignSelf: 'center', paddingBottom: 4, gap: 10 },
  filtros: { flexDirection: 'row', gap: 8 },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.card,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  campoBusca: { flex: 1, color: cores.textoPrincipal, paddingVertical: 12 },
  vazio: { color: cores.textoSecundario, marginTop: 24 },
  aviso: { color: cores.destaque, backgroundColor: cores.destaqueFundo, padding: 12, borderRadius: 12, marginTop: 16 },
  erro: { color: cores.negativo, backgroundColor: cores.negativoFundo, padding: 12, borderRadius: 12, marginTop: 16 },
});
