// Tudo que fala com o Banco Central fica aqui.

export type SerieBC = { data: string; valor: number };

export async function buscarSerieBC(codigo: number): Promise<SerieBC> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`BCB ${codigo}: HTTP ${resposta.status}`);
  const dados = await resposta.json();
  const ultimo = dados[0];
  return { data: ultimo.data, valor: parseFloat(ultimo.valor) };
}

export const buscarIpcaMensal = () => buscarSerieBC(433);
export const buscarIpca12m = () => buscarSerieBC(13522);
export const buscarSelic = () => buscarSerieBC(432);
export const buscarDolar = () => buscarSerieBC(1);
