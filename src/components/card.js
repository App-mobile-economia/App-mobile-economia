import { View, Text, StyleSheet } from "react-native";

// O cartãozinho de indicador, com o próprio estilo junto.
export default function Card({ titulo, valor, detalhe, corDetalhe }) {
  return (
    <View style={estilos.card}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.valor}>{valor}</Text>
      {detalhe ? (
        <Text style={[estilos.detalhe, { color: corDetalhe || "#666" }]}>
          {detalhe}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  titulo: { fontSize: 14, color: "#666" },
  valor: { fontSize: 26, fontWeight: "700", color: "#111", marginTop: 4 },
  detalhe: { fontSize: 13, marginTop: 4 },
});