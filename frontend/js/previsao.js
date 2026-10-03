import { atualizarCeu } from './ceu.js';
const $ = seletor => document.querySelector(seletor);
let formatoHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const grausValidos = graus => Number.isFinite(graus) ? graus : 0;
const direcao = graus => ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.round(grausValidos(graus) / 45) % 8];
const animacoes = new WeakMap();
const nomeIcone = codigo => {
  const noite = codigo?.endsWith("n");
  const icones = {
    "01": noite ? "clear-night" : "clear-day", "02": noite ? "partly-cloudy-night" : "partly-cloudy-day",
    "03": "cloudy", "04": "cloudy", "09": "drizzle", "10": "rain",
    "11": noite ? "thunderstorms-night-rain" : "thunderstorms-day-rain", "13": "snow",
    "50": noite ? "fog-night" : "fog-day"
  };
  return icones[codigo?.slice(0, 2)] || "not-available";
};
const urlMeteocon = codigo => `assets/weather/${nomeIcone(codigo)}.json`;

function renderizarIcone(elemento, codigo, descricao) {
  animacoes.get(elemento)?.destroy();
  elemento.replaceChildren();
  elemento.setAttribute("aria-label", descricao || "Condição do tempo");
  if (!window.lottie) return;
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animacao = window.lottie.loadAnimation({
    container: elemento, renderer: "svg", loop: !reduzirMovimento, autoplay: !reduzirMovimento,
    path: urlMeteocon(codigo), rendererSettings: { preserveAspectRatio: "xMidYMid meet" }
  });
  if (reduzirMovimento) animacao.goToAndStop(0, true);
  animacoes.set(elemento, animacao);
}

export function exibirPrevisao(dados) {
  const atual = dados.atual;
  atualizarCeu(atual);
  document.body.classList.add('com-previsao');
  formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: dados.fusoHorario || 'UTC' });
  $("#local").textContent = [dados.cidade, dados.pais].filter(Boolean).join(" - ");
  $("#temperatura").textContent = `${Math.round(atual.temperatura)}°`;
  $("#condicao").textContent = atual.descricao;
  $("#sensacao").textContent = `${Math.round(atual.sensacaoTermica)}°C`;
  $("#umidade").textContent = `${atual.umidade}%`;
  $("#vento").textContent = `${Math.round(atual.vento)} km/h`;
  $("#direcao").textContent = direcao(atual.direcaoVento);
  document.querySelectorAll('#horas .icone-lottie, #dias .icone-lottie').forEach(elemento => animacoes.get(elemento)?.destroy());
  $("#horas").replaceChildren(...dados.previsaoHoraria.slice(0, 12).map(criarHora));
  const dias = dados.previsaoDiaria || [];
  $('#area-dias').hidden = dias.length === 0;
  $('#extremos').textContent = dias.length ? `Máx. ${Math.round(dias[0].maxima)}° · Mín. ${Math.round(dias[0].minima)}°` : '';
  const menor = Math.min(...dias.map(dia => dia.minima)), maior = Math.max(...dias.map(dia => dia.maxima));
  $('#dias').replaceChildren(...dias.map((dia, i) => criarDia(dia, i, menor, maior, dados.fusoHorario)));
  const areaAvisos = $("#area-avisos");
  $("#lista-avisos").replaceChildren(...dados.avisos.map(criarAviso));
  areaAvisos.hidden = dados.avisos.length === 0;
  $("#previsao").hidden = false;
}

function criarDia(dia, indice, menor, maior, fuso) {
  const linha = document.createElement('article'); linha.className = 'dia';
  const nome = document.createElement('span'); nome.className = 'dia-nome';
  nome.textContent = indice === 0 ? 'Hoje' : new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: fuso || 'UTC' }).format(new Date(dia.data * 1000));
  const grupo = document.createElement('div'); grupo.className = 'dia-icone';
  const icone = document.createElement('div'); icone.className = 'icone-lottie'; icone.setAttribute('role', 'img'); grupo.append(icone);
  if (dia.probabilidadeChuva > 0) { const chuva = document.createElement('small'); chuva.textContent = `${dia.probabilidadeChuva}%`; grupo.append(chuva); }
  const minima = document.createElement('span'); minima.className = 'minima'; minima.textContent = `${Math.round(dia.minima)}°`;
  const maxima = document.createElement('span'); maxima.className = 'maxima'; maxima.textContent = `${Math.round(dia.maxima)}°`;
  const faixa = document.createElement('div'); faixa.className = 'faixa'; faixa.setAttribute('aria-hidden', 'true');
  const barra = document.createElement('span'), amplitude = Math.max(maior - menor, 1);
  barra.style.left = `${(dia.minima - menor) / amplitude * 100}%`; barra.style.width = `${Math.max((dia.maxima - dia.minima) / amplitude * 100, 2)}%`; faixa.append(barra);
  linha.append(nome, grupo, minima, faixa, maxima); renderizarIcone(icone, dia.icone, dia.descricao); return linha;
}

function criarHora(hora) {
  const artigo = document.createElement("article");
  artigo.className = "hora";
  const horario = document.createElement("strong");
  horario.textContent = formatoHora.format(new Date(hora.dataHora * 1000));
  const icone = document.createElement("div");
  icone.className = "icone-lottie";
  icone.setAttribute("role", "img");
  const temperatura = document.createElement("span");
  temperatura.textContent = `${Math.round(hora.temperatura)}°`;
  const chuva = document.createElement("small");
  chuva.textContent = `☔ ${hora.probabilidadeChuva}%`;
  artigo.append(horario, icone, temperatura, chuva);
  renderizarIcone(icone, hora.icone, hora.descricao);
  return artigo;
}

function criarAviso(aviso) {
  const artigo = document.createElement("article");
  artigo.className = "aviso";
  artigo.innerHTML = `<h3>${aviso.evento}</h3><p><strong>${aviso.origem}</strong> · ${formatoData.format(new Date(aviso.inicio * 1000))} até ${formatoData.format(new Date(aviso.fim * 1000))}</p><p>${aviso.descricao}</p>`;
  return artigo;
}

