// Tudo que fala com o Banco Central fica aqui.

export async function buscarSerieBC(codigo) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/1?formato=json`;
  const resposta = await fetch(url);
  const dados = await resposta.json();
  const ultimo = dados[0];
  return {
    data: ultimo.data,
    valor: parseFloat(ultimo.valor), // o valor vem como texto, então convertemos
  };
}

// Atalhos com nomes fáceis de entender
export const buscarIpcaMensal = () => buscarSerieBC(433);
export const buscarIpca12m = () => buscarSerieBC(13522);
export const buscarSelic = () => buscarSerieBC(432);
export const buscarDolar = () => buscarSerieBC(1);
