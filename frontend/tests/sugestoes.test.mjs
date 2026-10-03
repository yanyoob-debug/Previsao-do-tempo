import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const fonte = (await readFile(new URL('../js/sugestoes.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '').replace('export function', 'function');
const concluir = () => new Promise(resolve => setImmediate(resolve));
class Elemento {
  constructor() { this.children = []; this.eventos = {}; this.atributos = {}; this.value = ''; this.textContent = ''; this.hidden = true; }
  addEventListener(nome, acao) { this.eventos[nome] = acao; }
  setAttribute(nome, valor) { this.atributos[nome] = valor; }
  removeAttribute(nome) { delete this.atributos[nome]; }
  append(...itens) { this.children.push(...itens); }
  replaceChildren(...itens) { this.children = itens; }
  scrollIntoView() {}
}
function iniciar(buscar) {
  const input = new Elemento(), lista = new Elemento(), status = new Elemento(), escolhidas = [];
  let timer;
  const contexto = {
    document: { querySelector: id => ({ '#cidade': input, '#sugestoes-cidades': lista, '#status-cidades': status })[id], createElement: () => new Elemento() },
    buscarCidades: buscar, AbortController,
    setTimeout: acao => { timer = acao; return 1; }, clearTimeout: () => { timer = null; }
  };
  vm.createContext(contexto); vm.runInContext(fonte, contexto);
  const controle = contexto.iniciarSugestoes(cidade => escolhidas.push(cidade));
  return { input, lista, status, escolhidas, controle,
    digitar(nome) { input.value = nome; input.eventos.input(); },
    carregar() { timer?.(); },
    tecla(key) { input.eventos.keydown({ key, preventDefault() {} }); }
  };
}
const cidade = { name: 'Fazenda Rio Grande', admin1: 'Paraná', country: 'Brasil', country_code: 'BR', latitude: -25.66, longitude: -49.31 };
test('aguarda a pausa na digitação e permite escolher com setas e Enter', async () => {
  const chamadas = [];
  const app = iniciar(async nome => { chamadas.push(nome); return [cidade]; });
  app.digitar('F'); app.carregar(); await concluir(); assert.equal(chamadas.length, 0);
  app.digitar('Faz'); assert.equal(chamadas.length, 0);
  app.carregar(); await concluir();
  assert.deepEqual(chamadas, ['Faz']);
  assert.equal(app.lista.hidden, false);
  assert.equal(app.lista.children[0].children[1].textContent, 'Paraná · Brasil');
  app.tecla('ArrowDown'); app.tecla('Enter');
  assert.equal(app.escolhidas[0], cidade); assert.equal(app.input.value, cidade.name);
  assert.equal(app.lista.hidden, true); assert.equal(app.controle.selecionada(), cidade);
  app.digitar('Curitiba'); assert.equal(app.controle.selecionada(), null);
});
test('ignora resposta atrasada após mudar o termo de busca', async () => {
  const pendentes = [];
  const app = iniciar(nome => new Promise(resolve => pendentes.push({ nome, resolve })));
  app.digitar('Faz'); app.carregar();
  app.digitar('Cur'); app.carregar();
  pendentes[1].resolve([{ ...cidade, name: 'Curitiba' }]); await concluir();
  pendentes[0].resolve([cidade]); await concluir();
  assert.equal(app.lista.children[0].children[0].textContent, 'Curitiba');
});
test('clique seleciona a cidade, Escape fecha e erros mantêm a busca disponível', async () => {
  const app = iniciar(async () => [cidade]);
  app.digitar('Faz'); app.carregar(); await concluir();
  app.lista.children[0].eventos.click(); assert.equal(app.escolhidas[0], cidade);
  app.digitar('Faz'); app.carregar(); await concluir(); app.tecla('Escape');
  assert.equal(app.lista.hidden, true);
  const falha = iniciar(async () => { throw new Error('Offline'); });
  falha.digitar('Faz'); falha.carregar(); await concluir();
  assert.match(falha.status.textContent, /ainda pode pesquisar/);
});
