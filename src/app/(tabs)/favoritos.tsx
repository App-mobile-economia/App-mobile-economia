// Aba Favoritos: lista os favoritos, permite escrever notas, apagar e ver o histórico por período.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Chip from '@/components/chip';
import EtiquetaVariacao from '@/components/etiqueta-variacao';
import ProtegidoPorBiometria from '@/components/protegido-por-biometria';
import { cores, LARGURA_MAXIMA } from '@/constants/cores';
import { FILTROS_GRUPO, FiltroGrupo, Meta, metaDaChave } from '@/constants/indicadores';
import { useSacudir } from '@/hooks/use-sacudir';
import { atualizarNota, Favorito, listarFavoritos, removerFavorito } from '@/services/favoritos';
import { buscarHistoricos, formatarValor, formatarVariacao, Historico, PERIODOS } from '@/services/historico';

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
  const [periodo, setPeriodo] = useState('30d'); // chave do período escolhido
  const [grupo, setGrupo] = useState<FiltroGrupo>('Todos');
  // Histórico de cada favorito, guardado pela chave do indicador.
  const [historicos, setHistoricos] = useState<Record<string, Historico>>({});

  // ---------- Carregar a lista ----------

  async function carregar() {
    try {
      const dados = await listarFavoritos();
      setFavoritos(dados);
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

  // Sacudir o celular recarrega a lista e o histórico.
  // "rodada" muda a cada sacudida e faz o histórico ser buscado de novo.
  const [rodada, setRodada] = useState(0);
  useSacudir(() => {
    carregar();
    setRodada(rodada + 1);
  });

  // ---------- Carregar o histórico ----------

  // Junta as chaves em um texto só (ex.: "ipca,bitcoin"). Assim o efeito abaixo
  // só roda de novo quando a lista de favoritos realmente muda.
  const chaves = favoritos.map((f) => f.indicador).join(',');

  useEffect(() => {
    if (chaves === '') {
      return;
    }

    let telaAindaAberta = true;

    // Descobre quantos dias tem o período escolhido (7, 30 ou 365).
    let dias = 30;
    for (const p of PERIODOS) {
      if (p.chave === periodo) {
        dias = p.dias;
      }
    }

    // Monta a lista de indicadores favoritos.
    const metas: Meta[] = [];
    for (const chave of chaves.split(',')) {
      metas.push(metaDaChave(chave));
    }

    buscarHistoricos(metas, dias).then((dados) => {
      if (telaAindaAberta) {
        setHistoricos(dados);
      }
    });

    return () => {
      telaAindaAberta = false;
    };
  }, [chaves, periodo, rodada]);

  // Ao trocar de período, apaga o histórico antigo (aparece "Carregando..." até chegar o novo).
  function trocarPeriodo(chave: string) {
    setPeriodo(chave);
    setHistoricos({});
  }

  // ---------- Notas e exclusão ----------

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

  // ---------- O que aparece na tela ----------

  // Botões de período (7 dias, 30 dias, 12 meses).
  const botoesDePeriodo = [];
  for (const p of PERIODOS) {
    botoesDePeriodo.push(
      <Chip key={p.chave} texto={p.titulo} ativo={periodo === p.chave} onPress={() => trocarPeriodo(p.chave)} />,
    );
  }

  // Botões de grupo (Todos, Economia, Criptomoedas).
  const botoesDeGrupo = [];
  for (const nome of FILTROS_GRUPO) {
    botoesDeGrupo.push(<Chip key={nome} texto={nome} ativo={grupo === nome} onPress={() => setGrupo(nome)} />);
  }

  // Um item para cada favorito do grupo escolhido.
  const itens = [];
  for (const favorito of favoritos) {
    const meta = metaDaChave(favorito.indicador);
    if (grupo !== 'Todos' && meta.grupo !== grupo) {
      continue; // não é do grupo escolhido
    }
    itens.push(
      <ItemFavorito
        key={favorito.id}
        favorito={favorito}
        meta={meta}
        historico={historicos[favorito.indicador]}
        onApagar={() => apagar(favorito.id)}
        onSalvarNota={(nota) => salvarNota(favorito.id, nota)}
      />,
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.centro}>
          <Text style={estilos.titulo}>Favoritos</Text>
          <Text style={estilos.subtitulo}>Escreva uma nota e saia do campo para salvar.</Text>

          {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

          <View style={estilos.filtros}>{botoesDePeriodo}</View>
          <View style={estilos.filtros}>{botoesDeGrupo}</View>

          {favoritos.length === 0 && !erro ? (
            <Text style={estilos.vazio}>Nenhum favorito ainda. Toque na estrela de um cartão no Painel.</Text>
          ) : null}

          {itens}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Um favorito da lista ----------

type ItemProps = {
  favorito: Favorito;
  meta: Meta;
  historico: Historico | undefined; // undefined = ainda carregando
  onApagar: () => void;
  onSalvarNota: (nota: string) => void;
};

function ItemFavorito({ favorito, meta, historico, onApagar, onSalvarNota }: ItemProps) {
  return (
    <View style={estilos.item}>
      {/* Título e botão de apagar */}
      <View style={estilos.linha}>
        <Ionicons name={meta.icone} size={20} color={cores.destaque} />
        <Text style={estilos.nome}>{meta.titulo}</Text>
        <Pressable onPress={onApagar} accessibilityRole="button" accessibilityLabel={'Remover ' + meta.titulo}>
          <Ionicons name="trash" size={20} color={cores.negativo} />
        </Pressable>
      </View>

      {/* Histórico do período */}
      <HistoricoDoItem meta={meta} historico={historico} />

      {/* Nota: salva quando a pessoa sai do campo */}
      <TextInput
        style={estilos.campo}
        defaultValue={favorito.nota}
        placeholder="Escreva uma nota..."
        placeholderTextColor={cores.textoSecundario}
        onEndEditing={(e) => onSalvarNota(e.nativeEvent.text)}
        accessibilityLabel={'Nota sobre ' + meta.titulo}
      />
    </View>
  );
}

// ---------- Histórico de um favorito ----------

function HistoricoDoItem({ meta, historico }: { meta: Meta; historico: Historico | undefined }) {
  if (historico === undefined) {
    return <Text style={estilos.historicoTexto}>Carregando histórico...</Text>;
  }

  if (historico.status === 'erro') {
    return <Text style={estilos.historicoTexto}>Não foi possível carregar o histórico.</Text>;
  }

  if (historico.status === 'sem-dados' || historico.resumo === undefined) {
    return (
      <Text style={estilos.historicoTexto}>
        Sem dados neste período (este indicador é atualizado com pouca frequência).
      </Text>
    );
  }

  // status "ok": mostra variação, valores e (quando existir) mínimo e máximo.
  const resumo = historico.resumo;
  const subiu = resumo.fim >= resumo.inicio;
  const temMinimoEMaximo = resumo.minimo !== undefined && resumo.maximo !== undefined;

  return (
    <View style={estilos.historico}>
      <EtiquetaVariacao subiu={subiu} texto={formatarVariacao(meta, resumo)} />
      <Text style={estilos.historicoTexto}>
        De {formatarValor(meta, resumo.inicio)} para {formatarValor(meta, resumo.fim)}
      </Text>
      {temMinimoEMaximo ? (
        <Text style={estilos.historicoTexto}>
          Mín {formatarValor(meta, resumo.minimo ?? 0)} · Máx {formatarValor(meta, resumo.maximo ?? 0)}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { alignItems: 'center', paddingBottom: 40 },
  centro: { width: '100%', maxWidth: LARGURA_MAXIMA, paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal },
  subtitulo: { fontSize: 13, color: cores.textoSecundario },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vazio: { color: cores.textoSecundario, marginTop: 24 },
  erro: { color: cores.negativo, backgroundColor: cores.negativoFundo, padding: 12, borderRadius: 12 },
  item: { backgroundColor: cores.card, borderColor: cores.borda, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nome: { flex: 1, color: cores.textoPrincipal, fontSize: 16, fontWeight: '600' },
  historico: { gap: 6 },
  historicoTexto: { color: cores.textoSecundario, fontSize: 13 },
  campo: {
    backgroundColor: cores.fundo,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: cores.textoPrincipal,
  },
});
