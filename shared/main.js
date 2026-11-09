import { reduce, $, $$, clamp, easeOut, easeInOut } from './utils.js';
import { initDesk } from '../home/home.js';
import { initInstax, initNecklace } from '../aboutme/aboutme.js';
import { initProjects } from '../proyects/proyects.js';
import { initZipper } from '../skills/skills.js';
import { initContact } from '../contact/contact.js';
import { initCursor } from './cursor.js';

/* =========================================================
   CARGA DE SECCIONES: cada carpeta tiene su propio .html
   ========================================================= */
const SECTIONS = ['home', 'aboutme', 'proyects', 'skills', 'contact'];
async function loadSections() {
  const stage = $('#stage');
  const htmls = await Promise.all(SECTIONS.map(s => fetch(`${s}/${s}.html`).then(r => {
    if (!r.ok) throw new Error(`No se pudo cargar ${s}/${s}.html (${r.status})`);
    return r.text();
  })));
  htmls.forEach(html => {
    // Live Server inyecta su script de recarga en cada .html (aquí lo mete dentro de un <svg> y rompe el HTML); se quita
    html = html.replace(/<!-- Code injected by live-server -->[\s\S]*?<\/script>/g, '');
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    // las páginas del libro van dentro del stage; lo demás (p. ej. la ventana de proyectos) va al body
    [...tpl.content.children].forEach(el => (el.matches('section.page') ? stage : document.body).appendChild(el));
  });
}

/* =========================================================
   PÁGINA: secciones que se abren en círculo desde el cursor, carpetas, menú
   ========================================================= */
/* ---------- book timeline (lengths in screen heights) ---------- */
const PAGES = ['home', 'about', 'projects', 'skills', 'contact'];
const TL = [
  { t: 'hold', len: .2 }, { t: 'flip', p: 0, len: 1.1 },
  { t: 'hold', len: .5 }, { t: 'flip', p: 1, len: 1.1 },
  { t: 'hold', len: .1 }, { t: 'stack', len: 1.2 }, { t: 'hold', len: .3 }, { t: 'flip', p: 2, len: 1.1 },
  { t: 'hold', len: .7 }, { t: 'flip', p: 3, len: 1.1 },
  { t: 'hold', len: .3 }
];
let acc = 0; TL.forEach(s => { s.start = acc; acc += s.len; });
const TOTAL = acc;
const pageStart = { home: 0 };
TL.forEach(s => { if (s.t === 'flip') pageStart[PAGES[s.p + 1]] = s.start + s.len + .02; });
// "Proyectos" lleva directo a las carpetas ya apiladas (fin del tramo stack)
const stackSeg = TL.find(s => s.t === 'stack');
pageStart.projects = stackSeg.start + stackSeg.len + .02;

let lenis = null;
// centro del círculo de transición: sigue al cursor con suavidad (en táctil, centro de la pantalla)
let cx = innerWidth / 2, cy = innerHeight * .55, tx = cx, ty = cy, transitioning = false;
const ring = document.createElement('div'); ring.className = 'reveal-ring'; ring.setAttribute('aria-hidden', 'true');
const book = $('#book');
let pageEls = [];
const folders = () => $$('.fp');
function layoutBook() { book.style.height = (TOTAL * innerHeight + innerHeight) + 'px'; }
function scrollFor(id) { return book.offsetTop + pageStart[id] * innerHeight; }
function update() {
  const s = (scrollY - book.offsetTop) / innerHeight;
  const flips = [0, 0, 0, 0];
  let stack = 0;
  TL.forEach(seg => {
    const p = clamp((s - seg.start) / seg.len, 0, 1);
    if (seg.t === 'flip') flips[seg.p] = p;
    if (seg.t === 'stack') stack = p;
  });
  // la sección siguiente se abre en un círculo que nace donde está el cursor (y lo sigue);
  // la anterior hace zoom hacia ese punto y se oscurece. Un anillo de luz marca el borde del círculo.
  const W = innerWidth, H = innerHeight;
  const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 4;
  let ringR = 0, ringA = 0;
  pageEls.forEach((el, i) => {
    const p = flips[i] || 0, prev = i ? flips[i - 1] : 1;
    const enter = easeInOut(prev), leave = i < 4 ? easeInOut(p) : 0;
    const face = el.querySelector('.face');
    if (enter < 1) {
      const r = enter * maxR;
      el.style.clipPath = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
      face.style.transformOrigin = `${cx}px ${cy}px`;
      face.style.transform = `scale(${(1.18 - .18 * enter).toFixed(4)})`;
      if (enter > 0) { ringR = r; ringA = Math.sin(enter * Math.PI); }
    } else { el.style.clipPath = ''; face.style.transform = ''; }
    el.style.transformOrigin = `${cx}px ${cy}px`;
    el.style.transform = leave > 0 ? `scale(${(1 + .14 * leave).toFixed(4)})` : '';
    el.querySelector('.shade').style.opacity = (leave * .65).toFixed(3);
    el.classList.toggle('live', prev > 0 && p < 1);
  });
  transitioning = ringA > 0;
  ring.style.opacity = ringA.toFixed(3);
  ring.style.width = ring.style.height = (ringR * 2) + 'px';
  ring.style.transform = `translate(${cx - ringR}px,${cy - ringR}px)`;
  folders().forEach((f, i) => {
    const q = clamp(stack * 2.2 - i * .6, 0, 1), e = easeOut(q);
    f.style.transform = `translateY(${(1 - e) * 110}vh)`;
  });
  let cur = 0; flips.forEach(p => { if (p > .5) cur++; });
  const id = PAGES[cur];
  $$('.nav a.link').forEach(a => a.dataset.target === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  document.body.dataset.nav = (id === 'home' || id === 'skills' || id === 'contact') ? 'light' : 'dark';
  pageEls[1].dataset.open = (flips[0] > .97 && flips[1] < .1) ? '1' : '0';
}

const curtain = $('.curtain');
function withCurtain(fn) {
  if (reduce) { fn(); return; }
  curtain.className = 'curtain in';
  setTimeout(() => { fn(); curtain.className = 'curtain out'; setTimeout(() => curtain.className = 'curtain', 520); }, 420);
}
function jump(id) { const y = scrollFor(id); lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); update(); }
function goTo(id, curtainFx = true) {
  const y = scrollFor(id);
  if (curtainFx === 'instant') { lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); update(); return; }
  if (curtainFx) withCurtain(() => { lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); update(); });
  else lenis ? lenis.scrollTo(y, { duration: 2.2, easing: t => 1 - Math.pow(1 - t, 3) }) : scrollTo({ top: y, behavior: 'smooth' });
}

function initBook() {
  pageEls = PAGES.map(id => document.getElementById(id));
  pageEls.forEach((el, i) => el.style.zIndex = i + 1);
  $('#stage').appendChild(ring);
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tx = e.clientX; ty = e.clientY; } }, { passive: true });
  const follow = () => {
    cx += (tx - cx) * .12; cy += (ty - cy) * .12;
    if (transitioning && (Math.abs(tx - cx) > .5 || Math.abs(ty - cy) > .5)) update();
    requestAnimationFrame(follow);
  };
  if (!reduce) requestAnimationFrame(follow);
  layoutBook(); addEventListener('resize', () => { layoutBook(); update(); });
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .08, smoothWheel: true, wheelMultiplier: .85 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    lenis.on('scroll', update);
  }
  addEventListener('scroll', update, { passive: true }); update();
  $$('.nav a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); setMenu(false);
    // "Proyectos" abre el escritorio con todos los proyectos (y deja detrás la sección de proyectos)
    if (a.dataset.target === 'projects') withCurtain(() => { jump('projects'); projects.show(); });
    else goTo(a.dataset.target, true);
  }));
  initMenu();
}

/* ---------- menú hamburguesa ---------- */
const burger = $('#burger'), menu = $('#menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  menu.setAttribute('aria-hidden', !open);
  menu.inert = !open;
  if (lenis) open ? lenis.stop() : lenis.start();
}
function initMenu() {
  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
}

/* ---------- splash: se va cuando todo cargó y "Nova" terminó de escribirse ---------- */
function hideSplash() {
  const sp = $('#splash'); if (!sp) return;
  if (!sp.dataset.go) { setTimeout(hideSplash, 100); return; }
  const wait = reduce ? 300 : Math.max(0, +sp.dataset.go + 3000 - performance.now());
  setTimeout(() => {
    sp.classList.add('out'); document.body.classList.remove('splash-on');
    if (lenis) { lenis.scrollTo(0, { immediate: true }); lenis.start(); }
    setTimeout(() => sp.classList.add('gone'), reduce ? 0 : 1000);
  }, wait);
}

const safe = fn => { try { const r = fn(); if (r && r.catch) r.catch(err => console.error(fn.name, err)); } catch (err) { console.error(fn.name, err); } };

try {
  await loadSections();
} catch (err) {
  console.error(err);
  $('#stage').innerHTML = '<p style="padding:20vh 6vw;font-size:18px">No se pudieron cargar las secciones. Abre la página con un servidor local (por ejemplo, la extensión Live Server de VS Code) en lugar de abrir el archivo directamente.</p>';
  $('#splash').classList.add('gone'); document.body.classList.remove('splash-on');
  throw err;
}
const projects = initProjects({ withCurtain, getLenis: () => lenis });
initBook();
[() => initDesk({ goTo }), initInstax, initNecklace, initZipper, initContact, initCursor].forEach(safe);
if (lenis) lenis.stop();
hideSplash();
