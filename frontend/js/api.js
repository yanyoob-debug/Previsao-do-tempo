const BASE_URL = "http://localhost:8080/api/previsao";
async function requisitar(parametros) { const resposta = await fetch(`${BASE_URL}?${new URLSearchParams(parametros)}`); const dados = await resposta.json().catch(() => ({})); if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível consultar a previsão."); return dados; }
export const buscarPorCidade = cidade => requisitar({ cidade });
export const buscarPorCoordenadas = (latitude, longitude) => requisitar({ latitude, longitude });
export async function buscarCidades(nome, signal) {
  const parametros = new URLSearchParams({ name: nome.trim(), count: 6, language: 'pt', format: 'json' });
  const resposta = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`, { signal });
  if (!resposta.ok) throw new Error('Sugestões indisponíveis. Você ainda pode pesquisar pelo nome.');
  const dados = await resposta.json();
  return dados.results || [];
}
