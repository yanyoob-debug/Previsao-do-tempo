import { buscarPorCidade, buscarPorCoordenadas } from "./api.js";
import { obterLocalizacao, obterCidadeAtual } from "./localizacao.js";
import { exibirPrevisao } from "./previsao.js";
import { iniciarSugestoes } from './sugestoes.js';
const mensagem = document.querySelector("#mensagem"), formulario = document.querySelector("#formulario-busca"), botao = document.querySelector("#botao-localizacao");
function informar(texto = "") { mensagem.textContent = texto; }
let consultaAtual = 0;
async function consultar(acao, texto = "Consultando previsão...") {
  const consulta = ++consultaAtual;
  informar(texto);
  try {
    const dados = await acao(() => consulta === consultaAtual);
    if (consulta !== consultaAtual || !dados) return;
    exibirPrevisao(dados);
    informar(dados.avisoLocalizacao || "");
  } catch (erro) {
    if (consulta === consultaAtual) informar(erro.message);
  }
}
function consultarCidadeSelecionada(cidade) {
  return consultar(async () => ({ ...await buscarPorCoordenadas(cidade.latitude, cidade.longitude), cidade: cidade.name, pais: cidade.country_code || '' }));
}
const sugestoes = iniciarSugestoes(consultarCidadeSelecionada);
formulario.addEventListener("submit", evento => {
  evento.preventDefault();
  const cidade = sugestoes.selecionada(); sugestoes.fechar();
  if (cidade) consultarCidadeSelecionada(cidade);
  else consultar(() => buscarPorCidade(new FormData(formulario).get("cidade")));
});
function consultarLocalizacao() {
  return consultar(async vigente => {
    const { latitude, longitude, accuracy } = await obterLocalizacao();
    if (!vigente()) return;
    informar("Consultando o clima da sua cidade...");
    const [previsao, local] = await Promise.allSettled([
      buscarPorCoordenadas(latitude, longitude),
      obterCidadeAtual(latitude, longitude)
    ]);
    if (previsao.status === 'rejected') throw previsao.reason;
    if (local.status === 'fulfilled') return { ...previsao.value, ...local.value,
      avisoLocalizacao: Number.isFinite(accuracy) && accuracy > 1000
        ? `Sua localização é aproximada (margem de ${Math.round(accuracy / 1000)} km). Pesquise a cidade se o nome estiver incorreto.` : '' };
    return { ...previsao.value, cidade: 'Cidade não identificada', pais: '',
      avisoLocalizacao: 'A previsão é da sua posição, mas não foi possível identificar o nome da cidade. Você pode pesquisar pelo nome.' };
  }, "Obtendo sua localização...");
}
botao.addEventListener("click", consultarLocalizacao);
consultarLocalizacao();
