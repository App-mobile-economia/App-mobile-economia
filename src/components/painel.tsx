import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BotaoAtualizar from '@/components/botao-atualizar';
import Cartao from '@/components/cartao';
import MenuLateral from '@/components/menu-lateral';
import TelaCarregando from '@/components/tela-carregando';
import { NOME_APP } from '@/constants/app';
import { cores, LARGURA_DESKTOP, LARGURA_MAXIMA } from '@/constants/cores';
import { buscarDolar, buscarIpca12m, buscarIpcaMensal, buscarSelic, SerieBC } from '@/services/api-bcb';
import { buscarCripto, Criptos } from '@/services/api-coingecko';
import { formatarPercentual, formatarReais } from '@/utils/formatadores';

type Dados = {
  ipca: SerieBC | null;
  ipca12m: SerieBC | null;
  selic: SerieBC | null;
  dolar: SerieBC | null;
  cripto: Criptos | null;
};

const vazio: Dados = { ipca: null, ipca12m: null, selic: null, dolar: null, cripto: null };

function valorOu<T>(r: PromiseSettledResult<T>, antigo: T | null): T | null {
  return r.status === 'fulfilled' ? r.value : antigo;
}

export default function Painel() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= LARGURA_DESKTOP;

  const [dados, setDados] = useState<Dados>(vazio);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    // allSettled: se uma fonte falhar, as demais continuam sendo exibidas.
    const r = await Promise.allSettled([
      buscarIpcaMensal(),
      buscarIpca12m(),
      buscarSelic(),
      buscarDolar(),
      buscarCripto(),
    ]);
    setDados((atual) => ({
      ipca: valorOu(r[0], atual.ipca),
      ipca12m: valorOu(r[1], atual.ipca12m),
      selic: valorOu(r[2], atual.selic),
      dolar: valorOu(r[3], atual.dolar),
      cripto: valorOu(r[4], atual.cripto),
    }));
    if (r.some((x) => x.status === 'rejected')) {
      setErro('Algumas informações não puderam ser carregadas. Tente atualizar novamente.');
    }
    if (r.some((x) => x.status === 'fulfilled')) {
      setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const { ipca, ipca12m, selic, dolar, cripto } = dados;
  const semDados = !ipca && !ipca12m && !selic && !dolar && !cripto;
  // Desktop: 4 colunas (economia) / 2 colunas (cripto). Celular: 2 colunas / 1 coluna.
  const colEconomia = desktop ? '24%' : '48.5%';
  const colCripto = desktop ? '49%' : '100%';

  if (carregando && semDados) return <TelaCarregando />;

  return (
    <View style={[estilos.tela, desktop && { flexDirection: 'row' }]}>
      {desktop && <MenuLateral carregando={carregando} atualizadoEm={atualizadoEm} onAtualizar={carregar} />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: desktop ? 0 : insets.top + 16, paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={carregando && !semDados}
            onRefresh={carregar}
            tintColor={cores.destaque}
            colors={[cores.destaque]}
            progressBackgroundColor={cores.card}
          />
        }>
        <View style={[estilos.conteudo, desktop && estilos.conteudoDesktop]}>
          <View style={estilos.cabecalho}>
            <View style={{ flex: 1 }}>
              <Text style={[estilos.titulo, desktop && { fontSize: 36 }]}>
                {desktop ? 'Visão geral' : NOME_APP}
              </Text>
              <Text style={estilos.subtitulo}>
                {atualizadoEm ? `Atualizado às ${atualizadoEm}` : 'Buscando dados...'}
              </Text>
            </View>
            {!desktop && <BotaoAtualizar compacto carregando={carregando} onPress={carregar} />}
          </View>

          {erro && (
            <View style={estilos.erro}>
              <Ionicons name="warning" size={18} color={cores.negativo} />
              <Text style={estilos.textoErro}>{erro}</Text>
            </View>
          )}


          {(ipca || ipca12m || selic || dolar) && (
            <>
              <Text style={estilos.secao}>Economia</Text>
              <View style={estilos.grade}>
                {ipca && (
                  <Cartao largura={colEconomia} icone="pricetag" titulo="IPCA do mês"
                    valor={formatarPercentual(ipca.valor)} detalhe={`Ref. ${ipca.data}`} />
                )}
                {ipca12m && (
                  <Cartao largura={colEconomia} atraso={80} icone="calendar" titulo="IPCA 12 meses"
                    valor={formatarPercentual(ipca12m.valor)} detalhe={`Ref. ${ipca12m.data}`} />
                )}
                {selic && (
                  <Cartao largura={colEconomia} atraso={160} icone="business" titulo="Selic (meta)"
                    valor={formatarPercentual(selic.valor)} detalhe={`Desde ${selic.data}`} />
                )}
                {dolar && (
                  <Cartao largura={colEconomia} atraso={240} icone="cash" titulo="Dólar (venda)"
                    valor={formatarReais(dolar.valor)} detalhe={`Em ${dolar.data}`} />
                )}
              </View>
            </>
          )}

          {cripto && (
            <>
              <Text style={estilos.secao}>Criptomoedas</Text>
              <View style={estilos.grade}>
                <Cartao largura={colCripto} atraso={320} icone="logo-bitcoin" titulo="Bitcoin (BTC)"
                  valor={formatarReais(cripto.bitcoin.brl)} variacao={cripto.bitcoin.brl_24h_change} />
                <Cartao largura={colCripto} atraso={400} icone="diamond" titulo="Ethereum (ETH)"
                  valor={formatarReais(cripto.ethereum.brl)} variacao={cripto.ethereum.brl_24h_change} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, width: '100%' },
  conteudoDesktop: { paddingHorizontal: 40, paddingTop: 40, maxWidth: LARGURA_MAXIMA },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontSize: 32, fontWeight: '800', color: cores.textoPrincipal },
  subtitulo: { fontSize: 13, color: cores.textoSecundario, marginTop: 4 },
  secao: { fontSize: 16, fontWeight: '700', color: cores.destaque, marginTop: 28, marginBottom: 12 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: cores.negativoFundo,
  },
  textoErro: { flex: 1, color: cores.negativo, fontSize: 13 },
});
