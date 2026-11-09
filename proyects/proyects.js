import { $, $$, reduce } from '../shared/utils.js';
import { CATEGORIES, PROJECTS, catOf } from './data.js';

/* =========================================================
   PROYECTOS
   · carpetas destacadas (featured 1/2/3) → "Ver proyecto" abre una carpeta con la ficha
   · escritorio estilo Mac: carpetas por categoría → archivos → ventana "Vista previa"
   Todo el contenido sale de proyects/data.js
   ========================================================= */

/* ---------- helpers ---------- */
// crea un elemento: h('p', { class: 'x' }, 'texto' | [hijos])
function h(tag, attrs = {}, kids = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'style') Object.entries(v).forEach(([p, val]) => el.style.setProperty(p, val));
    else el.setAttribute(k, v);
  }
  [].concat(kids).forEach(k => k != null && k !== '' && el.append(k));
  return el;
}
// imagen o video; si el archivo todavía no existe, se ve un marcador del color de la categoría
function media(src, { color = '#EBA9C0', label = '', small = '', cls = '', video = false, alt = '' } = {}) {
  const ph = () => h('div', { class: ('ph ' + cls).trim(), style: { '--pc': color }, role: 'img', 'aria-label': `${label} ${small}`.trim() }, [label, small ? h('small', {}, small) : '']);
  if (!src) return ph();
  const el = video ? h('video', { class: cls || null, controls: '', playsinline: '', preload: 'metadata' }) : h('img', { class: cls || null, alt, loading: 'lazy', decoding: 'async' });
  el.addEventListener('error', () => el.replaceWith(ph()), { once: true });
  el.src = src;
  return el;
}
// diapositivas de un proyecto: primero el video (si tiene), luego las imágenes
const slidesOf = p => [...(p.video ? [{ video: true, src: p.video, n: 'video' }] : []), ...p.images.map((src, i) => ({ src, n: `imagen ${i + 1}` }))];
const infoRows = p => [['Cliente', p.client], ['Año', p.year], ['Rol', p.role], ['Herramientas', (p.tools || []).join(' · ')]].filter(([, v]) => v);

export function initProjects({ withCurtain, getLenis }) {
  const lockScroll = on => { document.body.classList.toggle('lock', on); const l = getLenis(); l && (on ? l.stop() : l.start()); };

  /* =========================================================
     1. CARPETAS DESTACADAS + carpeta abierta
     ========================================================= */
  $$('.fp[data-slot]').forEach(art => {
    const p = PROJECTS.find(x => String(x.featured) === art.dataset.slot);
    if (!p) { art.hidden = true; return; }
    const c = catOf(p);
    art.style.setProperty('--c', c.color);
    $('h3', art).textContent = p.title;
    $('.fp-meta', art).replaceChildren(...[p.year, c.name].filter(Boolean).flatMap(t => [t, h('br')]), h('span', { style: { opacity: '.7' } }, p.role));
    $('.fp-desc', art).textContent = p.summary;
    $$('.print .img', art).forEach((im, i) => im.replaceWith(media(p.images[i], { color: c.color, label: p.title, small: `imagen ${i + 1}`, cls: 'img', alt: `${p.title}, imagen ${i + 1}` })));
    $('.fp-link', art).addEventListener('click', e => openDoc(p, e.currentTarget));
  });

  const doc = $('#projDoc'), fd = $('#fdFolder'); let docFrom = null;
  function openDoc(p, from) {
    const c = catOf(p); docFrom = from;
    fd.style.setProperty('--c', c.color);
    $('#fdTab').textContent = `Proyecto destacado · ${c.name}`;
    $('#fdCoverLabel').textContent = p.title;
    const kids = [
      h('span', { class: 'fd-stamp' }, 'DESTACADO'),
      h('p', { class: 'fd-k' }, `Expediente · ${c.name}`),
      h('h2', { id: 'fdTitle' }, p.title),
      h('p', { class: 'fd-sum' }, p.summary)
    ];
    const rows = infoRows(p);
    if (rows.length) kids.push(h('dl', { class: 'fd-kv' }, rows.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])));
    if (p.problem) kids.push(h('h3', {}, 'El reto'), h('p', {}, p.problem));
    if (p.process && p.process.length) kids.push(h('h3', {}, 'Proceso'), h('ol', {}, p.process.map(t => h('li', {}, t))));
    if (p.solution) kids.push(h('h3', {}, 'La solución'), h('p', {}, p.solution));
    if (p.link) kids.push(h('a', { class: 'fd-link', href: p.link, target: '_blank', rel: 'noopener' }, 'Ver caso completo ↗'));
    $('#fdSheet').replaceChildren(...kids);
    const rots = ['-1.5deg', '2deg', '-2.5deg', '1.5deg', '-1deg', '2.5deg'];
    $('#fdGal').replaceChildren(...slidesOf(p).map((s, i) => h('figure', { class: 'fd-print', style: { '--r': rots[i % rots.length] } }, [
      i % 2 ? '' : h('span', { class: 'tape' }),
      media(s.src, { color: c.color, label: p.title, small: s.n, video: s.video, alt: `${p.title}, ${s.n}` }),
      h('figcaption', {}, s.video ? 'video ♡' : `0${i + 1 - (p.video ? 1 : 0)}`)
    ])));
    $('#fdSheet').scrollTop = 0; $('#fdGal').scrollTop = 0;
    const cover = $('.fd-cover', fd); cover.style.animation = 'none'; void cover.offsetWidth; cover.style.animation = '';
    doc.hidden = false; lockScroll(true);
    $('#fdClose').focus({ preventScroll: true });
  }
  function closeDoc() {
    doc.hidden = true; $$('video', doc).forEach(v => v.pause());
    if (!ov.classList.contains('open')) lockScroll(false);
    docFrom && docFrom.focus({ preventScroll: true });
  }
  $('#fdClose').addEventListener('click', closeDoc);
  doc.addEventListener('click', e => { if (e.target === doc) closeDoc(); });

  /* =========================================================
     2. ESCRITORIO MAC
     ========================================================= */
  const ov = $('#allProjects');
  function show() { ov.classList.add('open'); lockScroll(true); tick(); clock = setInterval(tick, 15000); }
  function hide() { closePv(); ov.classList.remove('open'); lockScroll(false); clearInterval(clock); }
  $('[data-all]').addEventListener('click', () => withCurtain(show));
  $('#closeAll').addEventListener('click', () => withCurtain(hide));

  // reloj de la barra de menú, como en Mac: "Dom 8 nov 18:33"
  const clockEl = $('#macClock'); let clock = 0;
  function tick() {
    const d = new Date(), part = o => d.toLocaleDateString('es-CO', o).replace(/\./g, '');
    const wd = part({ weekday: 'short' }), pad = n => String(n).padStart(2, '0');
    clockEl.textContent = `${wd[0].toUpperCase()}${wd.slice(1)} ${d.getDate()} ${part({ month: 'short' })} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------- Finder: raíz (carpetas) → carpeta (archivos) ---------- */
  const board = $('#board'), grid = $('#finderGrid'), side = $('#finderSide'), search = $('#projSearch');
  const back = $('#finderBack'), title = $('#finderTitle'), path = $('#finderPath'), count = $('#projCount'), empty = $('.af-empty', board);
  let view = { mode: 'root' };

  side.replaceChildren(
    h('p', { class: 'side-h' }, 'Favoritos'),
    h('button', { class: 'side-i', type: 'button', 'data-cat': '' }, 'Todos los proyectos'),
    h('p', { class: 'side-h' }, 'Categorías'),
    ...CATEGORIES.map(c => h('button', { class: 'side-i', type: 'button', 'data-cat': c.id }, c.name))
  );
  side.addEventListener('click', e => {
    const b = e.target.closest('.side-i'); if (!b) return;
    search.value = ''; go(b.dataset.cat ? { mode: 'cat', cat: b.dataset.cat } : { mode: 'root' });
  });

  function folderEl(c) {
    const ps = PROJECTS.filter(p => p.cat === c.id);
    const sheets = [0, 1, 2].map(i => { const p = ps[i % Math.max(1, ps.length)]; return h('span', { class: 'sheet' }, media(p && p.images[0], { color: c.color, label: p ? p.title : c.name, cls: 'img' })); });
    const el = h('button', { class: 'af', type: 'button', style: { '--c': c.color }, 'aria-label': `Abrir la carpeta ${c.name} (${ps.length} proyectos)` }, [
      h('span', { class: 'box' }, [h('span', { class: 'ab' }), h('span', { class: 'at' }, sheets), h('span', { class: 'af-f' })]),
      h('span', { class: 'lbl-w' }, h('span', { class: 'lbl' }, c.folder))
    ]);
    el.addEventListener('click', () => go({ mode: 'cat', cat: c.id }));
    return el;
  }
  function fileEl(p, showCat) {
    const c = catOf(p);
    const el = h('button', { class: 'fi', type: 'button', 'aria-label': `Abrir ${p.title}` }, [
      h('span', { class: 'fi-thumb' }, [media(p.images[0], { color: c.color, label: p.title }), p.video ? h('span', { class: 'fi-play', 'aria-hidden': 'true' }, '▶') : '']),
      h('span', { class: 'fi-name' }, p.file),
      showCat ? h('span', { class: 'fi-cat' }, c.name) : ''
    ]);
    el.addEventListener('click', () => openPv(p, el));
    return el;
  }
  function go(v) { view = v; render(); }
  function render() {
    const c = view.cat && CATEGORIES.find(x => x.id === view.cat);
    let items;
    if (view.mode === 'root') items = CATEGORIES.map(folderEl);
    else if (view.mode === 'cat') items = PROJECTS.filter(p => p.cat === view.cat).map(p => fileEl(p));
    else {
      const q = view.q.toLowerCase();
      items = PROJECTS.filter(p => [p.title, p.client, p.file, catOf(p).name].join(' ').toLowerCase().includes(q)).map(p => fileEl(p, true));
    }
    grid.replaceChildren(...items);
    board.classList.toggle('in-folder', view.mode !== 'root');
    board.scrollTop = 0;
    empty.hidden = items.length > 0;
    back.disabled = view.mode === 'root';
    title.textContent = view.mode === 'root' ? 'proyectos_juliana' : view.mode === 'cat' ? c.name : `Resultados para “${view.q}”`;
    path.textContent = view.mode === 'cat' ? `proyectos_juliana › ${c.folder}` : 'proyectos_juliana';
    count.textContent = `${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}`;
    $$('.side-i', side).forEach(b => b.classList.toggle('on', view.mode === 'search' ? false : b.dataset.cat === (view.cat || '')));
  }
  back.addEventListener('click', () => { search.value = ''; go({ mode: 'root' }); });
  search.addEventListener('input', () => { const q = search.value.trim(); go(q ? { mode: 'search', q } : { mode: 'root' }); });
  render();

  /* ---------- ventana "Vista previa" de un proyecto ---------- */
  const pv = $('#pv'), stage = $('#pvStage'), thumbs = $('#pvThumbs'), prev = $('#pvPrev'), next = $('#pvNext');
  let cur = null, slides = [], idx = 0, pvFrom = null;
  function openPv(p, from) {
    const c = catOf(p); cur = p; slides = slidesOf(p); pvFrom = from;
    $('#pvFile').textContent = p.file + (p.video ? '.mp4' : '.png');
    const kids = [
      h('span', { class: 'pv-chip', style: { '--pc': c.color } }, [h('i'), c.name]),
      h('h2', { id: 'pvTitle' }, p.title),
      h('p', { class: 'pv-sum' }, p.summary)
    ];
    const rows = infoRows(p);
    if (rows.length) kids.push(h('dl', { class: 'pv-kv' }, rows.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])));
    if (p.problem) kids.push(h('h3', {}, 'El reto'), h('p', {}, p.problem));
    if (p.process && p.process.length) kids.push(h('h3', {}, 'Proceso'), h('ol', {}, p.process.map(t => h('li', {}, t))));
    if (p.solution) kids.push(h('h3', {}, 'La solución'), h('p', {}, p.solution));
    if (p.link) kids.push(h('a', { class: 'pv-link', href: p.link, target: '_blank', rel: 'noopener' }, 'Ver caso completo ↗'));
    $('#pvInfo').replaceChildren(...kids); $('#pvInfo').scrollTop = 0;
    thumbs.replaceChildren(...(slides.length > 1 ? slides.map((s, i) => {
      const b = h('button', { type: 'button', 'aria-label': `Ver ${s.n}` }, s.video ? h('div', { class: 'ph', style: { '--pc': c.color } }, '▶') : media(s.src, { color: c.color, label: String(i + 1) }));
      b.addEventListener('click', () => showSlide(i));
      return b;
    }) : []));
    showSlide(0);
    pv.hidden = false;
    $('#pvClose').focus({ preventScroll: true });
  }
  function showSlide(i) {
    idx = (i + slides.length) % slides.length;
    const s = slides[idx], c = catOf(cur);
    $$('video', stage).forEach(v => v.pause());
    stage.replaceChildren(media(s.src, { color: c.color, label: cur.title, small: s.n, video: s.video, alt: `${cur.title}, ${s.n}` }));
    $$('button', thumbs).forEach((b, j) => b.classList.toggle('on', j === idx));
    prev.hidden = next.hidden = slides.length < 2;
  }
  function closePv() {
    if (pv.hidden) return;
    $$('video', pv).forEach(v => v.pause());
    pv.hidden = true; pvFrom && pvFrom.focus({ preventScroll: true });
  }
  prev.addEventListener('click', () => showSlide(idx - 1));
  next.addEventListener('click', () => showSlide(idx + 1));
  $('#pvClose').addEventListener('click', closePv);

  /* ---------- teclado: Esc cierra lo de arriba; flechas cambian de imagen ---------- */
  addEventListener('keydown', e => {
    if (!doc.hidden) { if (e.key === 'Escape') closeDoc(); return; }
    if (!ov.classList.contains('open')) return;
    if (!pv.hidden) {
      if (e.key === 'Escape') closePv();
      else if (e.key === 'ArrowRight') showSlide(idx + 1);
      else if (e.key === 'ArrowLeft') showSlide(idx - 1);
      return;
    }
    if (e.key === 'Escape') withCurtain(hide);
  });

  /* ---------- dock: los íconos crecen según qué tan cerca está el cursor ---------- */
  const dock = $('#dock'), icons = $$('.dk', dock);
  if (!reduce) {
    // los centros se miden al entrar (con todo en tamaño normal) para que no tiemble al crecer
    let centers = [];
    dock.addEventListener('pointerenter', () => { centers = icons.map(ic => { const r = ic.getBoundingClientRect(); return r.left + r.width / 2; }); });
    dock.addEventListener('pointermove', e => icons.forEach((ic, i) => {
      const d = Math.abs(e.clientX - centers[i]);
      ic.style.setProperty('--s', (1 + .55 * Math.max(0, 1 - d / 140)).toFixed(3));
    }));
    dock.addEventListener('pointerleave', () => icons.forEach(ic => ic.style.setProperty('--s', 1)));
  }

  return { show };
}
