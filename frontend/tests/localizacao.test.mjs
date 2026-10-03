import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { obterCidadeAtual, identificarCidade } from '../js/localizacao.js';

const codigo = (await readFile(new URL('../js/app.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
const concluir = () => new Promise(resolve => setImmediate(resolve));
function iniciar(opcoes = {}) {
  const elementos = new Map();
  for (const id of ['#mensagem', '#formulario-busca', '#botao-localizacao']) {
    elementos.set(id, { textContent: '', eventos: {}, addEventListener(nome, acao) { this.eventos[nome] = acao; } });
  }
  const exibidos = [], chamadas = [];
  const contexto = {
    iniciarSugestoes: () => ({ selecionada: () => null, fechar() {} }),
    document: { querySelector: id => elementos.get(id) },
    FormData: class { get() { return 'Curitiba'; } },
    obterLocalizacao: async () => ({ latitude: -27, longitude: -51 }),
    obterCidadeAtual: async () => ({ cidade: 'Videira', pais: 'BR' }),
    buscarPorCoordenadas: async (...coordenadas) => { chamadas.push(coordenadas); return { cidade: 'Localização atual' }; },
    buscarPorCidade: async () => ({ cidade: 'Curitiba' }),
    exibirPrevisao: dados => exibidos.push(dados),
    ...opcoes
  };
  vm.runInNewContext(codigo, contexto);
  return { elementos, exibidos, chamadas };
}
test('busca automaticamente e exibe a cidade identificada', async () => {
  const app = iniciar(); await concluir();
  assert.deepEqual(app.chamadas, [[-27, -51]]);
  assert.equal(app.exibidos[0].cidade, 'Videira');
  assert.equal(app.exibidos[0].pais, 'BR');
  assert.equal(app.elementos.get('#mensagem').textContent, '');
});
test('permissão negada mantém busca manual e permite tentar novamente', async () => {
  let tentativas = 0;
  const app = iniciar({ obterLocalizacao: async () => { tentativas++; throw new Error('Permissão negada'); } });
  await concluir();
  assert.equal(app.exibidos.length, 0);
  assert.equal(app.elementos.get('#mensagem').textContent, 'Permissão negada');
  await app.elementos.get('#formulario-busca').eventos.submit({ preventDefault() {} });
  await concluir(); assert.equal(app.exibidos[0].cidade, 'Curitiba');
  await app.elementos.get('#botao-localizacao').eventos.click();
  assert.equal(tentativas, 2);
});
test('falha na identificação não impede mostrar o clima da posição', async () => {
  const app = iniciar({ obterCidadeAtual: async () => { throw new Error('Serviço indisponível'); } });
  await concluir();
  assert.equal(app.exibidos[0].cidade, 'Cidade não identificada');
  assert.match(app.elementos.get('#mensagem').textContent, /não foi possível identificar/);
});
test('busca manual tem prioridade sobre localização ainda pendente', async () => {
  let resolver;
  const app = iniciar({ obterLocalizacao: () => new Promise(resolve => { resolver = resolve; }) });
  app.elementos.get('#formulario-busca').eventos.submit({ preventDefault() {} });
  await concluir();
  resolver({ latitude: -27, longitude: -51 }); await concluir();
  assert.equal(app.exibidos.length, 1);
  assert.equal(app.exibidos[0].cidade, 'Curitiba');
  assert.equal(app.chamadas.length, 0);
});
test('geocodificação prefere a cidade e usa a localidade quando necessário', async () => {
  const original = globalThis.fetch;
  try {
    let endereco;
    globalThis.fetch = async url => { endereco = url; return { ok: true, json: async () => ({ city: 'Videira', locality: 'Centro', countryCode: 'BR' }) }; };
    assert.deepEqual(await obterCidadeAtual(-27, -51), { cidade: 'Videira', pais: 'BR' });
    assert.equal(new URL(endereco).searchParams.get('localityLanguage'), 'pt');
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ locality: 'Videira' }) });
    assert.equal((await obterCidadeAtual(-27, -51)).cidade, 'Videira');
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(obterCidadeAtual(-27, -51), /identificar sua cidade/);
  } finally { globalThis.fetch = original; }
});
test('prioriza município brasileiro em vez da região metropolitana ou bairro', () => {
  const dados = { countryCode: 'BR', city: 'Região Metropolitana de Curitiba', locality: 'Eucaliptos',
    localityInfo: { administrative: [
      { adminLevel: 4, name: 'Paraná' },
      { adminLevel: 6, name: 'Região Metropolitana de Curitiba' },
      { adminLevel: 8, name: 'Fazenda Rio Grande' },
      { adminLevel: 10, name: 'Eucaliptos' }
    ] } };
  assert.equal(identificarCidade(dados), 'Fazenda Rio Grande');
  assert.equal(identificarCidade({ countryCode: 'BR', city: dados.city, locality: 'Fazenda Rio Grande' }), 'Fazenda Rio Grande');
  assert.equal(identificarCidade({ countryCode: 'BR', city: 'Curitiba', locality: 'Centro' }), 'Curitiba');
});
test('avisa quando o navegador fornece posição com margem ampla', async () => {
  const app = iniciar({ obterLocalizacao: async () => ({ latitude: -27, longitude: -51, accuracy: 6500 }) });
  await concluir();
  assert.match(app.elementos.get('#mensagem').textContent, /localização é aproximada/);
});
