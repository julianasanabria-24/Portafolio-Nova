import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* =========================================================
   SHARED HELPERS
   ========================================================= */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const toastEl = $('.toast'); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2400); }

function makeRenderer(canvas, { shadows = false, alpha = true } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = .8;
  if (shadows) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
  return r;
}
function envMap(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pm.dispose(); return t;
}
// runs a render loop only while the canvas is on screen
function runWhenVisible(canvas, tick) {
  let on = false, raf = 0, last = performance.now();
  const page = canvas.closest('.page');
  const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!page || page.classList.contains('live')) tick(dt, now / 1000); raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
  }, { rootMargin: '100px' }).observe(canvas);
}
function fitRenderer(renderer, camera, canvas, onResize) {
  const fn = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); onResize && onResize(w, h);
  };
  new ResizeObserver(fn).observe(canvas); fn();
}
function canvasTex(w, h, draw, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
let _seed = 11;
const rnd = () => (_seed = (_seed * 16807) % 2147483647) / 2147483647;
function noiseTex(size = 256, amt = 60, base = 128) {
  return canvasTex(size, size, (c, w, h) => {
    const d = c.createImageData(w, h);
    for (let i = 0; i < d.data.length; i += 4) { const v = base + (Math.random() - .5) * amt; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    c.putImageData(d, 0, 0);
  }, { srgb: false, repeat: true });
}
function grainOver(c, w, h, a = 18) {
  const d = c.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - .5) * a; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
  c.putImageData(d, 0, 0);
}

/* materials */
const M = {
  silver: () => new THREE.MeshPhysicalMaterial({ color: 0xf1f1f4, metalness: 1, roughness: .16 }),
  pearl: () => new THREE.MeshPhysicalMaterial({ color: 0xf7f0ea, roughness: .22, clearcoat: 1, clearcoatRoughness: .1, iridescence: .7, iridescenceIOR: 1.3, sheen: .6, sheenColor: new THREE.Color(0xffe6ef) }),
  plastic: (color, rough = .28) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: .8, clearcoatRoughness: .15 }),
  leather: (color, bump) => new THREE.MeshPhysicalMaterial({ color, roughness: .55, sheen: .4, sheenColor: new THREE.Color(0xffd0e0), bumpMap: bump, bumpScale: .6, clearcoat: .25, clearcoatRoughness: .5 }),
  glass: (color = 0xffffff, op = .25) => new THREE.MeshPhysicalMaterial({ color, roughness: .04, transmission: 1, thickness: .3, ior: 1.45, transparent: true, opacity: 1, clearcoat: 1 }),
};

/* geometry helpers */
function heartShape(s = 1) {
  const h = new THREE.Shape();
  h.moveTo(0, -0.9 * s);
  h.bezierCurveTo(-0.5 * s, -0.45 * s, -1.0 * s, -0.05 * s, -0.95 * s, 0.38 * s);
  h.bezierCurveTo(-0.9 * s, 0.82 * s, -0.3 * s, 0.98 * s, 0, 0.58 * s);
  h.bezierCurveTo(0.3 * s, 0.98 * s, 0.9 * s, 0.82 * s, 0.95 * s, 0.38 * s);
  h.bezierCurveTo(1.0 * s, -0.05 * s, 0.5 * s, -0.45 * s, 0, -0.9 * s);
  return h;
}
function roundRectShape(w, h, r, x = -w / 2, y = -h / 2) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// chain of interlocking links between two points
const _linkGeoCache = {};
function chain(a, b, size, mat) {
  const key = size.toFixed(3);
  const geo = _linkGeoCache[key] || (_linkGeoCache[key] = new THREE.TorusGeometry(size, size * .26, 8, 18).scale(1, 1.55, 1));
  const g = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length(); dir.normalize();
  const step = size * 2.3; const n = Math.max(1, Math.round(len / step));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  for (let i = 0; i <= n; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(a).addScaledVector(dir, (i / n) * len);
    m.quaternion.copy(q);
    if (i % 2) m.rotateY(Math.PI / 2);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}
function ring(r, tube, mat, seg = 40) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, seg), mat); m.castShadow = true; return m; }
function at(m, x, y, z, r) { m.position.set(x, y, z); if (r) m.rotation.set(...r); return m; }
function mesh(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }

function photoPlaceholder(c, w, h, label = 'tu foto') {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#F9D7E3'); g.addColorStop(1, '#EBA9C0');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(214,40,110,.25)';
  c.beginPath(); c.arc(w / 2, h * .42, w * .17, 0, 7); c.fill();
  c.beginPath(); c.ellipse(w / 2, h * 1.02, w * .36, h * .32, 0, 0, 7); c.fill();
  c.fillStyle = '#D6286E'; c.font = `700 ${Math.round(w * .11)}px Caveat, cursive`; c.textAlign = 'center'; c.fillText(label, w / 2, h * .9);
}
const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([
  document.fonts.load('600 italic 40px "Playfair Display"'), document.fonts.load('500 40px "Playfair Display"'),
  document.fonts.load('40px "Pinyon Script"'), document.fonts.load('700 40px Caveat'), document.fonts.load('700 40px "DM Sans"')
]).catch(() => {}) : Promise.resolve();

export {
  reduce, $, $$, clamp, lerp, easeOut, easeOutBack, easeInOut, toast,
  makeRenderer, envMap, runWhenVisible, fitRenderer, canvasTex, rnd, noiseTex, grainOver,
  M, heartShape, roundRectShape, chain, ring, at, mesh, photoPlaceholder, fontsReady
};
