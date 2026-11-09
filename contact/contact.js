import { $, $$, toast, runWhenVisible } from '../shared/utils.js';

/* =========================================================
   CONTACTO: video de Nova con filtro de puntos rosados
   ========================================================= */
export function initContact() {
  const cv = $('#eyes'), ctx = cv.getContext('2d');
  const video = $('#contactVideo');
  const off = document.createElement('canvas'), oc = off.getContext('2d', { willReadFrequently: true });
  let W = 0, H = 0, dpr = 1, STEP = 7;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; STEP = W < 700 ? 5 : 7;
    off.width = Math.ceil(W / STEP); off.height = Math.ceil(H / STEP);
  }
  new ResizeObserver(size).observe(cv); size();
  const tryPlay = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
  // el video se carga entero en memoria: así volver al inicio no depende de que el servidor permita saltar dentro del archivo
  fetch(video.currentSrc || video.src).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { video.src = URL.createObjectURL(b); tryPlay(); }).catch(() => {});
  // respaldo del loop: si por algo termina, vuelve a empezar
  video.addEventListener('ended', () => { video.currentTime = 0; tryPlay(); });
  let drawn = false;
  function render() {
    // mientras el video vuelve al inicio no hay cuadro listo: se deja el último dibujo en vez de pintar todo rosado
    const ready = video.readyState >= 2 && !video.seeking;
    if (!ready && drawn) return;
    const ow = off.width, oh = off.height, c = oc;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#fff'; c.fillRect(0, 0, ow, oh);
    if (ready) {
      drawn = true;
      // video fills the right side of the page; the text lives on the left
      const narrow = W < 800;
      // crop 5% off every edge of the source so no phone border shows
      const vw0 = video.videoWidth, vh0 = video.videoHeight, ix = vw0 * .05, iy = vh0 * .05, vw = vw0 - ix * 2, vh = vh0 - iy * 2;
      const areaX = narrow ? 0 : W * .34, areaW = W - areaX, areaH = narrow ? H * .7 : H;
      const s = Math.max(areaW / vw, areaH / vh);
      const dx = areaX + (areaW - vw * s) / 2, dy = (areaH - vh * s) / 2;
      c.save(); c.scale(1 / STEP, 1 / STEP);
      c.filter = 'contrast(1.2) brightness(1.06)';
      c.drawImage(video, ix, iy, vw, vh, dx, dy, vw * s, vh * s);
      c.filter = 'none';
      // soft fade so the photo melts into the pink, no hard edge
      const g = narrow ? c.createLinearGradient(0, areaH * .5, 0, areaH) : c.createLinearGradient(Math.max(0, dx) - 2, 0, Math.max(0, dx) + areaW * .42, 0);
      g.addColorStop(0, narrow ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,1)'); g.addColorStop(1, narrow ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)');
      c.fillStyle = '#fff'; if (!narrow) c.fillRect(0, 0, Math.max(0, dx) + 2, H);
      c.fillStyle = g; narrow ? c.fillRect(0, areaH * .5, W, H) : c.fillRect(Math.max(0, dx) - 2, 0, areaW * .42 + 4, H);
      c.restore();
    }
    const d = c.getImageData(0, 0, ow, oh).data;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#D6286E'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5E0B2E'; ctx.beginPath();
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const i = (y * ow + x) * 4, l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
      const r = STEP * .62 * Math.pow(1 - l, .85);
      if (r > .3) { const px = x * STEP + STEP / 2, py = y * STEP + STEP / 2; ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, 6.2832); }
    }
    ctx.fill();
  }
  runWhenVisible(cv, () => { if (video.paused) tryPlay(); render(); });
  $$('.clink').forEach(a => a.addEventListener('click', e => { if (a.getAttribute('href') === '#') { e.preventDefault(); toast(`Aquí va tu link de ${a.dataset.name} ♡`); } }));
  initMailMenu();
}

/* "Email" abre un menú: copiar el correo, Gmail, Outlook o la app de correo.
   (mailto: solo funciona si el equipo tiene una app de correo configurada) */
function initMailMenu() {
  const link = $('[data-mail]'), pop = $('#mailPop');
  if (!link || !pop) return;
  const url = new URL(link.href), mail = decodeURIComponent(url.pathname), subject = url.searchParams.get('subject') || '';
  const q = encodeURIComponent;
  $('[data-act="gmail"]', pop).href = `https://mail.google.com/mail/?view=cm&fs=1&to=${q(mail)}&su=${q(subject)}`;
  $('[data-act="outlook"]', pop).href = `https://outlook.live.com/mail/0/deeplink/compose?to=${q(mail)}&subject=${q(subject)}`;
  $('[data-act="app"]', pop).href = link.href;

  const setOpen = open => {
    pop.hidden = !open; link.setAttribute('aria-expanded', open);
    if (open) pop.style.setProperty('--mx', link.offsetLeft + 'px');
  };
  link.addEventListener('click', e => { e.preventDefault(); setOpen(pop.hidden); });
  $('[data-act="copy"]', pop).addEventListener('click', () => { copy(mail); setOpen(false); });
  $$('a', pop).forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== link && !link.contains(e.target)) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { setOpen(false); link.focus(); } });
}

function copy(text) {
  const done = () => toast(`Correo copiado: ${text} ♡`);
  if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, () => fallback()); return; }
  fallback();
  function fallback() {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); done(); } catch { toast(`Mi correo: ${text}`); }
    t.remove();
  }
}
