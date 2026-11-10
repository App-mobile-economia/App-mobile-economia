import { fireEvent, render, screen } from '@testing-library/react-native';

import Cartao from '@/components/cartao';
import Chip from '@/components/chip';
import EtiquetaVariacao from '@/components/etiqueta-variacao';
import TelaCarregando from '@/components/tela-carregando';
import { Indicador } from '@/services/api';

const selic: Indicador = {
  chave: 'selic',
  grupo: 'Economia',
  titulo: 'Selic (meta)',
  icone: 'business',
  valor: '10,50%',
  detalhe: 'Desde 01/10/2026',
};

const bitcoin: Indicador = {
  chave: 'bitcoin',
  grupo: 'Criptomoedas',
  titulo: 'Bitcoin (BTC)',
  icone: 'logo-bitcoin',
  valor: 'R$ 400.000',
  variacao: 2.5,
};

describe('Chip', () => {
  test('mostra o texto', async () => {
    await render(<Chip texto="Economia" ativo={false} onPress={jest.fn()} />);
    expect(screen.getByText('Economia')).toBeTruthy();
  });

  test('chama onPress ao tocar', async () => {
    const aoTocar = jest.fn();
    await render(<Chip texto="Economia" ativo={false} onPress={aoTocar} />);
    await fireEvent.press(screen.getByText('Economia'));
    expect(aoTocar).toHaveBeenCalledTimes(1);
  });

  test('avisa leitores de tela quando está selecionado', async () => {
    await render(<Chip texto="30 dias" ativo onPress={jest.fn()} />);
    expect(screen.getByRole('button', { selected: true })).toBeTruthy();
  });

  test('não está selecionado quando inativo', async () => {
    await render(<Chip texto="30 dias" ativo={false} onPress={jest.fn()} />);
    expect(screen.queryByRole('button', { selected: true })).toBeNull();
  });
});

describe('EtiquetaVariacao', () => {
  test('subiu: seta para cima', async () => {
    await render(<EtiquetaVariacao subiu texto="+2,00%" />);
    expect(screen.getByText('icone:trending-up')).toBeTruthy();
    expect(screen.getByText('+2,00%')).toBeTruthy();
  });

  test('caiu: seta para baixo', async () => {
    await render(<EtiquetaVariacao subiu={false} texto="-2,00%" />);
    expect(screen.getByText('icone:trending-down')).toBeTruthy();
  });
});

describe('TelaCarregando', () => {
  test('mostra o nome do app e a mensagem', async () => {
    await render(<TelaCarregando />);
    expect(screen.getByText('Economia Hoje')).toBeTruthy();
    expect(screen.getByText('Buscando informações...')).toBeTruthy();
  });
});

describe('Cartao', () => {
  test('mostra título, valor e detalhe', async () => {
    await render(<Cartao indicador={selic} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" />);
    expect(screen.getByText('Selic (meta)')).toBeTruthy();
    expect(screen.getByText('10,50%')).toBeTruthy();
    expect(screen.getByText('Desde 01/10/2026')).toBeTruthy();
  });

  test('indicador sem variação não mostra a etiqueta de 24h', async () => {
    await render(<Cartao indicador={selic} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" />);
    expect(screen.queryByText(/em 24h/)).toBeNull();
  });

  test('criptomoeda mostra a variação de 24h', async () => {
    await render(<Cartao indicador={bitcoin} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" />);
    expect(screen.getByText('2,50% em 24h')).toBeTruthy();
    expect(screen.getByText('icone:trending-up')).toBeTruthy();
  });

  test('variação negativa mostra seta para baixo e valor sem sinal', async () => {
    await render(
      <Cartao indicador={{ ...bitcoin, variacao: -3.2 }} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" />,
    );
    expect(screen.getByText('3,20% em 24h')).toBeTruthy();
    expect(screen.getByText('icone:trending-down')).toBeTruthy();
  });

  test('variação zero conta como alta', async () => {
    await render(
      <Cartao indicador={{ ...bitcoin, variacao: 0 }} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" />,
    );
    expect(screen.getByText('0,00% em 24h')).toBeTruthy();
    expect(screen.getByText('icone:trending-up')).toBeTruthy();
  });

  test('estrela vazia quando não é favorito, com texto "Favoritar"', async () => {
    await render(<Cartao indicador={selic} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" />);
    expect(screen.getByLabelText('Favoritar Selic (meta)')).toBeTruthy();
    expect(screen.getByText('icone:star-outline')).toBeTruthy();
  });

  test('estrela cheia quando é favorito, com texto "Remover"', async () => {
    await render(<Cartao indicador={selic} favorito onFavoritar={jest.fn()} atraso={0} largura="48%" />);
    expect(screen.getByLabelText('Remover Selic (meta) dos favoritos')).toBeTruthy();
    expect(screen.getByText('icone:star')).toBeTruthy();
  });

  test('tocar na estrela chama onFavoritar', async () => {
    const aoFavoritar = jest.fn();
    await render(<Cartao indicador={selic} favorito={false} onFavoritar={aoFavoritar} atraso={0} largura="48%" />);
    await fireEvent.press(screen.getByLabelText('Favoritar Selic (meta)'));
    expect(aoFavoritar).toHaveBeenCalledTimes(1);
  });

  test('modo compacto também mostra o título', async () => {
    await render(<Cartao indicador={selic} favorito={false} onFavoritar={jest.fn()} atraso={0} largura="48%" compacto />);
    expect(screen.getByText('Selic (meta)')).toBeTruthy();
  });
});
