import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Card from "../components/card.js";
import { cores } from "../constants/tema.js";
import {
  buscarDolar,
  buscarIpca12m,
  buscarIpcaMensal,
  buscarSelic,
} from "../services/bcb";
import { buscarCripto } from "../services/coingecko";
import { formatarPercentual, formatarReais } from "../utils/formatar";

export default function App() {
  const [ipca, setIpca] = useState(null);
  const [ipca12m, setIpca12m] = useState(null);
  const [selic, setSelic] = useState(null);
  const [dolar, setDolar] = useState(null);
  const [cripto, setCripto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  async function carregarDados() {
    try {
      setErro(null);
      const [ipcaMes, ipcaAno, selicMeta, dolarVenda, criptos] =
        await Promise.all([
          buscarIpcaMensal(),
          buscarIpca12m(),
          buscarSelic(),
          buscarDolar(),
          buscarCripto(),
        ]);
      setIpca(ipcaMes);
      setIpca12m(ipcaAno);
      setSelic(selicMeta);
      setDolar(dolarVenda);
      setCripto(criptos);
      setAtualizadoEm(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (e) {
      setErro(
        "Não foi possível carregar os dados. Puxe a tela para baixo para tentar de novo.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const primeiraCarga = carregando && !dolar;

  return (
    <View style={estilos.tela}>
      <StatusBar barStyle="light-content" backgroundColor={cores.fundo} />
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={carregarDados}
            tintColor={cores.destaque}
            colors={[cores.destaque]}
            progressBackgroundColor={cores.card}
          />
        }
      >
        <Text style={estilos.titulo}>Indicadores</Text>
        <Text style={estilos.subtitulo}>
          {atualizadoEm ? `Atualizado às ${atualizadoEm}` : "Buscando dados..."}
        </Text>

        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

        {primeiraCarga && (
          <ActivityIndicator
            size="large"
            color={cores.destaque}
            style={{ marginTop: 40 }}
          />
        )}

        {dolar && (
          <>
            <Text style={estilos.secao}>Economia</Text>
            <View style={estilos.grade}>
              <Card
                metade
                titulo="IPCA do mês"
                valor={formatarPercentual(ipca.valor)}
                detalhe={`Ref. ${ipca.data}`}
              />
              <Card
                metade
                titulo="IPCA 12 meses"
                valor={formatarPercentual(ipca12m.valor)}
                detalhe={`Ref. ${ipca12m.data}`}
              />
              <Card
                metade
                titulo="Selic (meta)"
                valor={formatarPercentual(selic.valor)}
                detalhe={`Desde ${selic.data}`}
              />
              <Card
                metade
                titulo="Dólar (venda)"
                valor={formatarReais(dolar.valor)}
                detalhe={`Em ${dolar.data}`}
              />
            </View>
          </>
        )}

        {cripto && (
          <>
            <Text style={estilos.secao}>Criptomoedas</Text>
            <Card
              titulo="Bitcoin (BTC)"
              valor={formatarReais(cripto.bitcoin.brl)}
              variacao={cripto.bitcoin.brl_24h_change}
            />
            <Card
              titulo="Ethereum (ETH)"
              valor={formatarReais(cripto.ethereum.brl)}
              variacao={cripto.ethereum.brl_24h_change}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, paddingTop: 64, paddingBottom: 40 },
  titulo: { fontSize: 32, fontWeight: "800", color: cores.textoPrincipal },
  subtitulo: { fontSize: 13, color: cores.textoSecundario, marginTop: 4 },
  secao: {
    fontSize: 16,
    fontWeight: "700",
    color: cores.destaque,
    marginTop: 28,
    marginBottom: 12,
  },
  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  erro: { color: cores.negativo, marginTop: 16 },
});
