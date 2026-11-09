import { reduce, $ } from '../shared/utils.js';

/* =========================================================
   INICIO: teclado, y la carpeta que se abre hacia "Sobre mí"
   ========================================================= */
export function initDesk({ goTo }) {
  const desk = $('#desk'), folder = $('#folder');
  let opened = false, at = 0;
  const paper = $('.f-paper', folder);
  // la hoja de la carpeta se vuelve la página "Sobre mí": sale, gira un poco y crece a pantalla completa
  function flyPaper() {
    const r = paper.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const fly = document.createElement('div'); fly.className = 'paper-fly paperbg';
    document.body.appendChild(fly); paper.style.visibility = 'hidden';
    const from = `translate(${r.left}px,${r.top}px) scale(${r.width / W},${r.height / H})`;
    const lift = `translate(${r.left}px,${r.top - H * .12}px) scale(${r.width / W * 1.06},${r.height / H * 1.06}) rotate(-3deg)`;
    const anim = fly.animate([
      { transform: from },
      { transform: lift, offset: .35, easing: 'cubic-bezier(.6,0,.2,1)' },
      { transform: 'none' }
    ], { duration: 850, easing: 'cubic-bezier(.3,.6,.2,1)', fill: 'forwards' });
    anim.finished.then(() => {
      goTo('about', 'instant');
      fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => fly.remove());
    });
  }
  function open() {
    if (opened) return; opened = true; at = performance.now();
    desk.classList.add('opened'); folder.classList.add('open');
    if (reduce) { goTo('about', 'instant'); return; }
    setTimeout(flyPaper, 600);
  }
  folder.addEventListener('click', open);
  folder.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  $('#openPost').addEventListener('click', open);
  addEventListener('scroll', () => {
    if (opened && scrollY < 5 && performance.now() - at > 3500) { opened = false; desk.classList.remove('opened'); folder.classList.remove('open'); paper.style.visibility = ''; }
  }, { passive: true });
}
