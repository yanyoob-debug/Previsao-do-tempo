const ceu = document.querySelector('#ceu');
const canvas = document.querySelector('#precipitacao');
const ctx = canvas.getContext('2d');
const movimento = matchMedia('(prefers-reduced-motion: reduce)');
let clima = 'Clear', largura = 0, altura = 0, particulas = [], frame, anterior = 0;
function dimensionar() {
  largura = innerWidth; altura = innerHeight;
  const escala = Math.min(devicePixelRatio || 1, 2);
  canvas.width = largura * escala; canvas.height = altura * escala;
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  particulas = Array.from({ length: Math.min(180, Math.ceil(largura / 6)) }, () => ({ x: Math.random() * largura, y: Math.random() * altura, tamanho: 1 + Math.random() * 2, velocidade: 500 + Math.random() * 450 }));
}
function desenhar(tempo) {
  const dt = Math.min((tempo - anterior) / 1000 || 0, .04); anterior = tempo;
  ctx.clearRect(0, 0, largura, altura);
  ctx.strokeStyle = '#d4ecff80'; ctx.fillStyle = '#ffffffbf'; ctx.lineWidth = 1;
  for (const p of particulas) {
    if (clima === 'Snow') {
      p.y += dt * p.velocidade / 12; p.x += Math.sin(tempo / 1800 + p.tamanho) * dt * 15;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2); ctx.fill();
    } else {
      p.y += dt * p.velocidade; p.x -= dt * 100;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 4, p.y + 20); ctx.stroke();
    }
    if (p.y > altura + 25) { p.y = -25; p.x = Math.random() * largura; }
    if (p.x < -10) p.x = largura + 10;
  }
  frame = requestAnimationFrame(desenhar);
}
function animar() {
  cancelAnimationFrame(frame); anterior = 0; ctx.clearRect(0, 0, largura, altura);
  if (!movimento.matches && !document.hidden && ['Rain', 'Thunderstorm', 'Snow'].includes(clima)) frame = requestAnimationFrame(desenhar);
}
export function atualizarCeu(atual) {
  clima = atual.condicao || 'Clear';
  ceu.dataset.clima = clima; ceu.dataset.noite = String(atual.icone?.endsWith('n') || false);
  const noite = ceu.dataset.noite === 'true';
  const paletas = { Rain: ['#253e58','#536d86','#9caabd'], Thunderstorm: ['#111d34','#34455f','#707f98'], Snow: ['#567a9a','#95b6cc','#d0dce7'], Fog: ['#627d92','#99aebd','#c3ced5'] };
  const cores = noite ? ['#101b38','#293d67','#667392'] : paletas[clima] || (atual.temperatura >= 28 ? ['#2375b1','#6ca4cc','#e3c8ad'] : atual.temperatura <= 10 ? ['#205899','#6c94be','#bac4d8'] : ['#1765ab','#518fcb','#b3b8cc']);
  ['--topo','--meio','--base'].forEach((nome, i) => ceu.style.setProperty(nome, cores[i]));
  animar();
}
addEventListener('resize', () => { dimensionar(); animar(); });
document.addEventListener('visibilitychange', animar);
movimento.addEventListener('change', animar);
dimensionar();
