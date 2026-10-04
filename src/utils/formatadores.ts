export function formatarReais(numero: number): string {
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarPercentual(numero: number): string {
  return numero.toFixed(2).replace('.', ',') + '%';
}
