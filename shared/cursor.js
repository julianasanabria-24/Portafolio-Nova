import { reduce } from './utils.js';

/* =========================================================
   CURSOR: punto + anillo que lo sigue; crece sobre lo clicable
   y cada clic suelta corazoncitos. Solo con mouse (no táctil).
   ========================================================= */
const HOVER = 'a, button, [role="button"], label, .bitem, .af, .folder, .dk, .ix-cam, .leather';

export function initCursor() {
  if (!matchMedia('(pointer: fine)').matches) return;
  const dot = document.createElement('div'), ring = document.createElement('div');
  dot.className = 'cur-dot'; ring.className = 'cur-ring';
  dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  document.documentElement.classList.add('has-cursor');

  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; document.documentElement.classList.add('cur-on'); }
    dot.style.transform = `translate(${x}px,${y}px)`;
    const t = e.target.closest ? e.target.closest(HOVER) : null;
    document.documentElement.classList.toggle('cur-hover', !!t);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { shown = false; document.documentElement.classList.remove('cur-on'); });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    document.documentElement.classList.add('cur-down');
    if (!reduce) burst(e.clientX, e.clientY);
  });
  addEventListener('pointerup', () => document.documentElement.classList.remove('cur-down'));

  const loop = () => {
    rx += (x - rx) * (reduce ? 1 : .18); ry += (y - ry) * (reduce ? 1 : .18);
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// corazoncitos que saltan desde el clic
function burst(x, y) {
  for (let i = 0; i < 5; i++) {
    const h = document.createElement('span');
    h.className = 'cur-heart'; h.textContent = '♡'; h.setAttribute('aria-hidden', 'true');
    h.style.left = x + 'px'; h.style.top = y + 'px';
    document.body.appendChild(h);
    const a = -Math.PI / 2 + (i - 2) * .45 + (Math.random() - .5) * .3, d = 34 + Math.random() * 26;
    h.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${(Math.random() - .5) * 40}deg)`, opacity: 0 }
    ], { duration: 650 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(() => h.remove());
  }
}
