import { StyleSheet, Text, View } from "react-native";
import { cores } from "../constants/tema";
import { formatarPercentual } from "../utils/formatar";

export default function Card({ titulo, valor, detalhe, variacao, metade }) {
  const temVariacao = typeof variacao === "number";
  const subiu = variacao >= 0;

  return (
    <View style={[estilos.card, metade && estilos.metade]}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.valor}>{valor}</Text>

      {temVariacao && (
        <View
          style={[
            estilos.etiqueta,
            {
              backgroundColor: subiu
                ? cores.positivoFundo
                : cores.negativoFundo,
            },
          ]}
        >
          <Text
            style={{
              color: subiu ? cores.positivo : cores.negativo,
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            {subiu ? "▲" : "▼"} {formatarPercentual(Math.abs(variacao))} em 24h
          </Text>
        </View>
      )}

      {detalhe ? <Text style={estilos.detalhe}>{detalhe}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: cores.card,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metade: { width: "48.5%" },
  titulo: { fontSize: 13, color: cores.textoSecundario },
  valor: {
    fontSize: 26,
    fontWeight: "700",
    color: cores.textoPrincipal,
    marginTop: 6,
  },
  detalhe: { fontSize: 12, color: cores.textoSecundario, marginTop: 8 },
  etiqueta: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
});
