// Valores a partir de R$ 1.000 saem sem centavos (ex.: R$ 402.553), para caber nos cartões do celular.
export function formatarReais(numero: number): string {
  const casas = numero >= 1000 ? 0 : 2;
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarPercentual(numero: number): string {
  return numero.toFixed(2).replace('.', ',') + '%';
}
