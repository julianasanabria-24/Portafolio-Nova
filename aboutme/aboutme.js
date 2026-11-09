import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { reduce, $, $$, clamp, M, makeRenderer, envMap, runWhenVisible, fitRenderer, canvasTex, heartShape, ring, mesh } from '../shared/utils.js';

/* =========================================================
   SOBRE MÍ: la Instax toma una foto y salen 3 fotos
   ========================================================= */
export function initInstax() {
  const wrap = $('#instax'), cam = $('#ixCam'), glow = $('#ixGlow'), flash = $('#pageFlash');
  const photos = $$('.ix-photo', wrap);
  // final spots, relative to the camera box (in % of the wrap)
  const SPOTS = [{ x: 0, y: 4, r: -10 }, { x: 31, y: -3, r: 4 }, { x: 62, y: 7, r: 11 }];
  let running = false, done = false;
  function place() {
    const wr = wrap.getBoundingClientRect(), cr = cam.getBoundingClientRect();
    return { wr, cr };
  }
  function shoot() {
    if (running) return; running = true;
    const { wr, cr } = place();
    photos.forEach(p => { p.getAnimations().forEach(a => a.cancel()); p.classList.remove('dev'); p.style.opacity = 0; });
    cam.classList.remove('shake'); void cam.offsetWidth; cam.classList.add('shake');
    glow.classList.remove('on'); void glow.offsetWidth; glow.classList.add('on');
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    const slotX = cr.left - wr.left + cr.width * .51, slotY = cr.top - wr.top + cr.height * .05;
    photos.forEach((p, i) => {
      const pw = p.offsetWidth, ph = p.offsetHeight, s = SPOTS[i];
      const sx = slotX - pw / 2, sy = slotY;            // inside the slot
      const ex = sx, ey = slotY - ph * .92;              // fully ejected
      const fx = wr.width * s.x / 100, fy = wr.height * .06 + wr.height * s.y / 100;
      p.style.left = '0px'; p.style.top = '0px';
      const delay = 150 + i * 420;
      const anim = p.animate([
        { transform: `translate(${sx}px,${sy}px) rotate(0deg)`, opacity: 1, zIndex: 1 },
        { transform: `translate(${ex}px,${ey}px) rotate(0deg)`, opacity: 1, zIndex: 1, offset: .45 },
        { transform: `translate(${ex}px,${ey - 30}px) rotate(${s.r / 3}deg)`, opacity: 1, zIndex: 4, offset: .6 },
        { transform: `translate(${fx}px,${fy}px) rotate(${s.r}deg)`, opacity: 1, zIndex: 4 }
      ], { duration: reduce ? 1 : 950, delay: reduce ? 0 : delay, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'both' });
      setTimeout(() => p.classList.add('dev'), (reduce ? 0 : delay) + 500);
      // rebote mínimo al caer en su sitio (translate no choca con el transform de arriba)
      if (!reduce) anim.finished.then(() => p.animate([{ translate: '0 0' }, { translate: '0 -7px' }, { translate: '0 0' }, { translate: '0 -2px' }, { translate: '0 0' }], { duration: 480, easing: 'ease-out' })).catch(() => {});
      if (i === photos.length - 1) anim.finished.then(() => { running = false; done = true; }).catch(() => { running = false; });
    });
  }
  cam.addEventListener('click', shoot);
  cam.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shoot(); } });
  // shoot once when the page "Sobre mí" is fully open
  const page = $('#about');
  const iv = setInterval(() => { if (!done && !running && page.dataset.open === '1') shoot(); }, 300);
}
/* =========================================================
   ABOUT: 3D keychain + necklace
   ========================================================= */
function furMaterial(color) {
  const bump = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const x = Math.random() * w, y = Math.random() * h, a = Math.random() * 6.28, l = 3 + Math.random() * 7; c.strokeStyle = Math.random() > .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  }, { srgb: false, repeat: true });
  bump.repeat.set(3, 3);
  return new THREE.MeshPhysicalMaterial({ color, roughness: .95, sheen: 1, sheenRoughness: .85, sheenColor: new THREE.Color(0xfff3ea), bumpMap: bump, bumpScale: 2.2 });
}
function fuzzy(geo, amt = .025) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) { const d = (Math.random() - .5) * amt; p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d); }
  geo.computeVertexNormals(); return geo;
}
function ellipsoid(mat, rx, ry, rz, x, y, z, fz = true) {
  const m = mesh(fz ? fuzzy(new THREE.SphereGeometry(1, 48, 32), .02) : new THREE.SphereGeometry(1, 48, 32), mat);
  m.scale.set(rx, ry, rz); m.position.set(x, y, z); return m;
}
function satinBow(mat, s = 1) {
  const g = new THREE.Group();
  [-1, 1].forEach(d => { const l = mesh(new THREE.TorusGeometry(.16, .065, 12, 32), mat); l.scale.set(1.25, .75, .6); l.position.x = d * .19; l.rotation.z = d * .25; g.add(l); });
  g.add(mesh(new THREE.SphereGeometry(.08, 20, 16).scale(1, 1.1, .8), mat));
  [-1, 1].forEach(d => { const t = mesh(new RoundedBoxGeometry(.11, .34, .03, 2, .012), mat); t.position.set(d * .1, -.2, .02); t.rotation.z = d * .35; g.add(t); });
  g.scale.setScalar(s); return g;
}
function keyGeo() {
  const s = new THREE.Shape(); s.absarc(0, 0, .26, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, .06, .08, 0, Math.PI * 2, true); s.holes.push(hole);
  const geoHead = new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 3, curveSegments: 32 });
  const b = new THREE.Shape(); b.moveTo(-.06, -.22); b.lineTo(.06, -.22); b.lineTo(.06, -.8); b.lineTo(.16, -.84); b.lineTo(.16, -.92); b.lineTo(.08, -.94); b.lineTo(.08, -1.0); b.lineTo(.14, -1.04); b.lineTo(.14, -1.12); b.lineTo(.06, -1.16); b.lineTo(.06, -1.28); b.lineTo(-.02, -1.34); b.lineTo(-.06, -1.3); b.lineTo(-.06, -.22);
  const geoBlade = new THREE.ExtrudeGeometry(b, { depth: .05, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 2 });
  return [geoHead, geoBlade];
}

export function initNecklace() {
  const canvas = $('#neckCanvas');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene(); scene.environment = envMap(renderer);
  const camera = new THREE.PerspectiveCamera(26, 1, .1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf2c6d6, .7));
  const kl = new THREE.DirectionalLight(0xffffff, 1.4); kl.position.set(-2, 4, 5); scene.add(kl);
  const silver = M.silver();
  const root = new THREE.Group(); root.position.y = 3.4; scene.add(root);
  const linkGeo = new THREE.TorusGeometry(.045, .014, 6, 14).scale(1, 1.5, 1);
  [-1, 1].forEach(d => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(d * 1.25, .6, 0), new THREE.Vector3(d * 1.0, -1.2, .05), new THREE.Vector3(d * .5, -3.0, .05), new THREE.Vector3(0, -3.95, 0)]);
    const len = curve.getLength(), n = Math.floor(len / .1);
    for (let i = 0; i < n; i++) {
      const t = i / n, m = new THREE.Mesh(linkGeo, silver);
      m.position.copy(curve.getPointAt(t));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(t));
      if (i % 2) m.rotateY(Math.PI / 2); root.add(m);
    }
  });
  const bail = ring(.12, .035, silver); bail.position.y = -4.05; bail.rotation.y = Math.PI / 2; root.add(bail);
  const locket = new THREE.Group(); locket.position.y = -4.62; root.add(locket);
  const outer = heartShape(.75); outer.holes.push(heartShape(.56));
  locket.add(mesh(new THREE.ExtrudeGeometry(outer, { depth: .12, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 5, curveSegments: 40 }), silver));
  // diamante rosado en forma de corazón, tallado en facetas (bisel con pocos segmentos + sombreado plano)
  const gemMat = new THREE.MeshPhysicalMaterial({ color: 0xf8669f, emissive: 0x3a0418, metalness: .15, roughness: .04, clearcoat: 1, clearcoatRoughness: 0, iridescence: .55, iridescenceIOR: 1.7, specularIntensity: 1, envMapIntensity: 2.4, flatShading: true });
  const gem = mesh(new THREE.ExtrudeGeometry(heartShape(.42), { depth: .05, bevelEnabled: true, bevelThickness: .17, bevelSize: .13, bevelSegments: 2, curveSegments: 7 }), gemMat);
  gem.position.z = .04; locket.add(gem);
  const back = mesh(new THREE.ExtrudeGeometry(heartShape(.75), { depth: .05, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 3, curveSegments: 40 }), silver);
  back.position.z = -.06; locket.add(back);
  const rl = ring(.08, .03, silver); rl.position.y = .5; rl.position.z = .05; locket.add(rl);

  function frame() {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const d = Math.max(5.6 / (2 * t), 3.0 / (2 * t * camera.aspect));
    camera.position.set(0, .7, d); camera.lookAt(0, .7, 0);
  }
  fitRenderer(renderer, camera, canvas, frame);
  const S = { a: .2, v: 0, t: 0, vt: 0 };
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  canvas.style.pointerEvents = 'auto';
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ptr, camera);
    if (ray.intersectObject(locket, true).length) { S.v = clamp(S.v + e.movementX * .004, -.4, .4); S.vt = clamp(S.vt + e.movementX * .02, -1.2, 1.2); }
  });
  runWhenVisible(canvas, (dt, now) => {
    const br = Math.sin(now * .7) * .03;
    S.v += (-3 * (S.a - br) - .9 * S.v) * dt; S.a = clamp(S.a + S.v * dt, -.1, .1);
    S.vt += (-2.5 * (S.t - Math.sin(now * .5) * .35) - .9 * S.vt) * dt; S.t = clamp(S.t + S.vt * dt, -.7, .7);
    root.rotation.z = S.a; locket.rotation.y = S.t;
    renderer.render(scene, camera);
  });
}
