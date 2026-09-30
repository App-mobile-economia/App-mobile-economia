import { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar } from "react-native";

import Card from "./src/components/Card";
import { formatarReais, formatarPercentual } from "./src/utils/formatar";
import { buscarIpcaMensal, buscarIpca12m, buscarSelic, buscarDolar } from "./src/services/bcb";
import { buscarCripto } from "./src/services/coingecko";

export default function App() {
  const [ipca, setIpca] = useState(null);
  const [ipca12m, setIpca12m] = useState(null);
  const [selic, setSelic] = useState(null);
  const [dolar, setDolar] = useState(null);
  const [cripto, setCripto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregarDados() {
    try {
      setErro(null);
      const [ipcaMes, ipcaAno, selicMeta, dolarVenda, criptos] = await Promise.all([
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
    } catch (e) {
      setErro("Não foi possível carregar os dados. Puxe a tela para tentar de novo.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function corVariacao(numero) {
    return numero >= 0 ? "#1a8f3c" : "#c62828";
  }

  return (
    <View style={estilos.tela}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregarDados} />}
      >
        <Text style={estilos.titulo}>Indicadores</Text>
        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

        <Text style={estilos.secao}>Economia</Text>
        {ipca && <Card titulo="IPCA (último mês)" valor={formatarPercentual(ipca.valor)} detalhe={`Referente a ${ipca.data}`} />}
        {ipca12m && <Card titulo="IPCA (acumulado 12 meses)" valor={formatarPercentual(ipca12m.valor)} detalhe={`Referente a ${ipca12m.data}`} />}
        {selic && <Card titulo="Selic (meta)" valor={formatarPercentual(selic.valor)} detalhe={`Atualizada em ${selic.data}`} />}
        {dolar && <Card titulo="Dólar (venda)" valor={formatarReais(dolar.valor)} detalhe={`Em ${dolar.data}`} />}

        <Text style={estilos.secao}>Criptomoedas</Text>
        {cripto && (
          <>
            <Card
              titulo="Bitcoin (BTC)"
              valor={formatarReais(cripto.bitcoin.brl)}
              detalhe={`${formatarPercentual(cripto.bitcoin.brl_24h_change)} em 24h`}
              corDetalhe={corVariacao(cripto.bitcoin.brl_24h_change)}
            />
            <Card
              titulo="Ethereum (ETH)"
              valor={formatarReais(cripto.ethereum.brl)}
              detalhe={`${formatarPercentual(cripto.ethereum.brl_24h_change)} em 24h`}
              corDetalhe={corVariacao(cripto.ethereum.brl_24h_change)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#f4f5f7" },
  conteudo: { padding: 20, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 8 },
  secao: { fontSize: 18, fontWeight: "600", color: "#333", marginTop: 20, marginBottom: 10 },
  erro: { color: "#c62828", marginVertical: 10 },
});
