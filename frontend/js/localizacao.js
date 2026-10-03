export function obterLocalizacao() { return new Promise((resolve, reject) => { if (!navigator.geolocation) return reject(new Error("Seu navegador não possui suporte à geolocalização.")); navigator.geolocation.getCurrentPosition(posicao => resolve(posicao.coords), erro => reject(new Error(erro.code === 1 ? "Permissão de localização negada. Pesquise uma cidade manualmente." : "Não foi possível obter sua localização.")), { enableHighAccuracy: true, timeout: 10000 }); }); }

// Endpoint gratuito exclusivo para coordenadas obtidas no dispositivo do usuário.
export async function obterCidadeAtual(latitude, longitude) {
  const parametros = new URLSearchParams({ latitude, longitude, localityLanguage: 'pt' });
  const resposta = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${parametros}`, {
    signal: AbortSignal.timeout(8000)
  });
  if (!resposta.ok) throw new Error('Não foi possível identificar sua cidade.');
  const dados = await resposta.json();
  const cidade = identificarCidade(dados);
  if (!cidade) throw new Error('Não foi possível identificar sua cidade.');
  return { cidade, pais: dados.countryCode || '' };
}

export function identificarCidade(dados) {
  // No Brasil, o nível 8 representa o município; os níveis posteriores
  // podem representar distritos e bairros, e city pode ser uma região.
  const municipio = dados.countryCode === 'BR'
    ? dados.localityInfo?.administrative?.find(item => Number(item.adminLevel) === 8 && item.name?.trim())
    : undefined;
  if (municipio) return municipio.name.trim();
  const cidade = dados.city?.trim(), localidade = dados.locality?.trim();
  const regiao = /regi[aã]o metropolitana|metropolitan (area|region)/i;
  if (cidade && regiao.test(cidade) && localidade && !regiao.test(localidade)) return localidade;
  return cidade || localidade;
}
