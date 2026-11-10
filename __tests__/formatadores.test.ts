import { formatarPercentual, formatarReais } from '@/utils/formatadores';

// O espaço entre "R$" e o número é um espaço especial; trocamos por um comum para comparar.
function limpar(texto: string) {
  return texto.replace(/ /g, ' ');
}

describe('formatarReais', () => {
  test('valor pequeno mostra centavos', () => {
    expect(limpar(formatarReais(5.4321))).toBe('R$ 5,43');
  });

  test('valor zero mostra centavos', () => {
    expect(limpar(formatarReais(0))).toBe('R$ 0,00');
  });

  test('valor abaixo de mil ainda mostra centavos', () => {
    expect(limpar(formatarReais(999.99))).toBe('R$ 999,99');
  });

  test('a partir de mil some com os centavos', () => {
    expect(limpar(formatarReais(1000))).toBe('R$ 1.000');
  });

  test('valor grande (Bitcoin) cabe sem centavos', () => {
    expect(limpar(formatarReais(402553.77))).toBe('R$ 402.554');
  });

  test('valor negativo mostra o sinal', () => {
    expect(limpar(formatarReais(-3.5))).toContain('3,50');
    expect(limpar(formatarReais(-3.5))).toContain('-');
  });
});

describe('formatarPercentual', () => {
  test('usa vírgula e duas casas', () => {
    expect(formatarPercentual(4.5)).toBe('4,50%');
  });

  test('arredonda para duas casas', () => {
    expect(formatarPercentual(0.456)).toBe('0,46%');
  });

  test('zero', () => {
    expect(formatarPercentual(0)).toBe('0,00%');
  });

  test('número negativo', () => {
    expect(formatarPercentual(-1.2)).toBe('-1,20%');
  });
});
