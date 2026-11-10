import { adicionarFavorito, atualizarNota, listarFavoritos, removerFavorito } from '@/services/favoritos';

// Supabase falso: cada chamada encadeada (from > select > order...) é registrada.
const chamadas: string[][] = [];
let resultado: { data?: unknown; error: unknown } = { data: [], error: null };

function mockConstrutor(nomes: string[]) {
  const passo: any = new Proxy(() => undefined, {
    get(_alvo, nome) {
      if (nome === 'then') {
        // Ao dar "await", registra o caminho completo e devolve o resultado combinado.
        return (resolver: (v: unknown) => void) => {
          chamadas.push(nomes);
          resolver(resultado);
        };
      }
      return (...args: unknown[]) => mockConstrutor([...nomes, nome as string + '(' + args.map((a) => JSON.stringify(a)).join(',') + ')']);
    },
  });
  return passo;
}

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (tabela: string) => mockConstrutor(['from(' + JSON.stringify(tabela) + ')']) },
}));

beforeEach(() => {
  chamadas.length = 0;
  resultado = { data: [], error: null };
});

describe('listarFavoritos', () => {
  test('lê id, indicador e nota ordenando por id', async () => {
    resultado = { data: [{ id: 1, indicador: 'selic', nota: '' }], error: null };
    const lista = await listarFavoritos();
    expect(lista).toEqual([{ id: 1, indicador: 'selic', nota: '' }]);
    expect(chamadas[0]).toEqual(['from("favoritos")', 'select("id, indicador, nota")', 'order("id")']);
  });

  test('erro do banco vira exceção', async () => {
    resultado = { error: new Error('PGRST205') };
    await expect(listarFavoritos()).rejects.toThrow('PGRST205');
  });
});

describe('adicionarFavorito', () => {
  test('insere o indicador (o user_id vem do banco)', async () => {
    await adicionarFavorito('bitcoin');
    expect(chamadas[0]).toEqual(['from("favoritos")', 'insert({"indicador":"bitcoin"})']);
  });

  test('erro do banco vira exceção', async () => {
    resultado = { error: new Error('falhou') };
    await expect(adicionarFavorito('bitcoin')).rejects.toThrow('falhou');
  });
});

describe('atualizarNota', () => {
  test('atualiza só a nota do favorito certo', async () => {
    await atualizarNota(7, 'comprar em março');
    expect(chamadas[0]).toEqual(['from("favoritos")', 'update({"nota":"comprar em março"})', 'eq("id",7)']);
  });

  test('erro do banco vira exceção', async () => {
    resultado = { error: new Error('falhou') };
    await expect(atualizarNota(1, 'x')).rejects.toThrow('falhou');
  });
});

describe('removerFavorito', () => {
  test('apaga o favorito pelo id', async () => {
    await removerFavorito(3);
    expect(chamadas[0]).toEqual(['from("favoritos")', 'delete()', 'eq("id",3)']);
  });

  test('erro do banco vira exceção', async () => {
    resultado = { error: new Error('falhou') };
    await expect(removerFavorito(3)).rejects.toThrow('falhou');
  });
});
