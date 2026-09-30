// Funções pequenas para deixar números bonitos na tela.

export function formatarReais(numero) {
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarPercentual(numero) {
  return numero.toFixed(2).replace(".", ",") + "%";
}
