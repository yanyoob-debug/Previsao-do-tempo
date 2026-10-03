import { buscarCidades } from './api.js';

export function iniciarSugestoes(aoSelecionar) {
  const input = document.querySelector('#cidade');
  const lista = document.querySelector('#sugestoes-cidades');
  const status = document.querySelector('#status-cidades');
  let resultados = [], ativo = -1, selecionada = null, timer, requisicao, versao = 0;
  function fechar() {
    lista.hidden = true; input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant'); ativo = -1;
  }
  function cancelar() { clearTimeout(timer); requisicao?.abort(); versao++; }
  function destacar(indice) {
    ativo = indice;
    [...lista.children].forEach((item, i) => item.setAttribute('aria-selected', String(i === ativo)));
    input.setAttribute('aria-activedescendant', `cidade-opcao-${ativo}`);
    lista.children[ativo]?.scrollIntoView({ block: 'nearest' });
  }
  function escolher(indice) {
    const cidade = resultados[indice]; if (!cidade) return;
    selecionada = cidade; input.value = cidade.name;
    cancelar(); fechar(); status.textContent = ''; aoSelecionar(cidade);
  }
  async function carregar(nome, identificador) {
    requisicao = new AbortController(); status.textContent = 'Buscando cidades...';
    try {
      const cidades = await buscarCidades(nome, requisicao.signal);
      if (identificador !== versao) return;
      resultados = cidades;
      lista.replaceChildren(...cidades.map((cidade, indice) => {
        const item = document.createElement('li');
        item.id = `cidade-opcao-${indice}`; item.setAttribute('role', 'option'); item.setAttribute('aria-selected', 'false');
        const nome = document.createElement('strong'); nome.textContent = cidade.name;
        const regiao = document.createElement('span'); regiao.textContent = [cidade.admin1, cidade.country || cidade.country_code].filter(Boolean).join(' · ');
        item.append(nome, regiao);
        item.addEventListener('pointerdown', evento => evento.preventDefault());
        item.addEventListener('click', () => escolher(indice));
        return item;
      }));
      lista.hidden = cidades.length === 0; input.setAttribute('aria-expanded', String(cidades.length > 0));
      status.textContent = cidades.length ? `${cidades.length} cidades encontradas. Use as setas e Enter para selecionar.` : 'Nenhuma cidade encontrada. Tente um nome mais completo.';
    } catch (erro) {
      if (identificador !== versao || erro.name === 'AbortError') return;
      fechar(); status.textContent = 'Sugestões indisponíveis. Você ainda pode pesquisar pelo nome.';
    }
  }
  input.addEventListener('input', () => {
    selecionada = null; cancelar(); fechar(); resultados = []; status.textContent = '';
    const nome = input.value.trim(); if (nome.length < 2) return;
    const identificador = versao;
    timer = setTimeout(() => carregar(nome, identificador), 300);
  });
  input.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') { cancelar(); fechar(); status.textContent = ''; return; }
    if (lista.hidden || !resultados.length) return;
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      destacar(evento.key === 'ArrowDown' ? (ativo + 1) % resultados.length : (ativo <= 0 ? resultados.length - 1 : ativo - 1));
    } else if (evento.key === 'Enter' && ativo >= 0) { evento.preventDefault(); escolher(ativo); }
  });
  input.addEventListener('blur', () => { cancelar(); fechar(); status.textContent = ''; });
  return { selecionada: () => selecionada, fechar: () => { cancelar(); fechar(); status.textContent = ''; } };
}
