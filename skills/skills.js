import { reduce, $, easeInOut } from '../shared/utils.js';

/* =========================================================
   HABILIDADES: cremallera que se abre; los objetos salen desde abajo
   Los objetos del bolso (imágenes y textos) están en skills.html
   ========================================================= */
export function initZipper() {
  const face = $('#bagFace'), pull = $('#pull'), hint = $('#pullHint'), top = $('#ltTop'), bot = $('#ltBot');
  let state = 0;
  function setOpen(p) {
    const W = face.clientWidth, x = 40 + p * (W + 60), gap = Math.min(140, p * 260);
    pull.style.setProperty('--px', x + 'px');
    // V-shaped opening behind the slider
    top.style.clipPath = p > 0 ? `polygon(0 0,100% 0,100% 100%,${x}px 100%,0 calc(100% - ${gap}px))` : '';
    bot.style.clipPath = p > 0 ? `polygon(0 ${gap}px,${x}px 0,100% 0,100% 100%,0 100%)` : '';
  }
  function unzip() {
    if (state) return; state = 1; hint.style.opacity = 0;
    const t0 = performance.now(), D = reduce ? 1 : 1500;
    const step = now => {
      const p = easeInOut(Math.min(1, (now - t0) / D)); setOpen(p);
      if (p < 1) requestAnimationFrame(step);
      else { state = 2; face.classList.remove('zipped'); face.classList.add('unzipped'); }
    };
    requestAnimationFrame(step);
  }
  pull.addEventListener('click', unzip);
  top.addEventListener('click', unzip); bot.addEventListener('click', unzip);
  initRow();
}

// fila infinita: se copia la fila hasta llenar la pantalla y luego se duplica, así el -50% de la animación empata sin salto
async function initRow() {
  const track = $('#btrack'), originals = [...track.children];
  await Promise.all(originals.map(el => el.querySelector('img').decode().catch(() => {})));
  const setWidth = () => originals.reduce((w, el) => w + el.offsetWidth + parseFloat(getComputedStyle(el).marginRight), 0);
  const copy = () => originals.forEach(el => {
    const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; track.appendChild(c);
  });
  const one = setWidth() || innerWidth;
  const sets = Math.max(1, Math.ceil(innerWidth / one));
  for (let i = 1; i < sets * 2; i++) copy();
  const SPEED = 120; // px por segundo
  track.style.animationDuration = (one * sets / SPEED) + 's';
}
