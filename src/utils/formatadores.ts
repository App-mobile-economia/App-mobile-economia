// Valores a partir de R$ 1.000 saem sem centavos (ex.: R$ 402.553), para caber nos cartões do celular.
export function formatarReais(numero: number): string {
  let casasDecimais = 2;
  if (numero >= 1000) {
    casasDecimais = 0;
  }

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

export function formatarPercentual(numero: number): string {
  return numero.toFixed(2).replace('.', ',') + '%';
}
