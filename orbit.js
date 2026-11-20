/* Орбитальный фон первого экрана: кольца-орбиты, по которым летают ноты, пластинки, обложки и кометы */
(() => {
  const canvas = document.getElementById('orbitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  // орбиты: радиус (доля от unit), наклон, сплюснутость, скорость (рад/с), направление
  const ALL_RINGS = [
    { r: .30, tilt: -.30, sq: .46, speed:  .34, dash: false },
    { r: .46, tilt: -.22, sq: .44, speed: -.24, dash: true  },
    { r: .62, tilt: -.34, sq: .42, speed:  .17, dash: false },
    { r: .78, tilt: -.26, sq: .40, speed: -.12, dash: true  },
    { r: .98, tilt: -.30, sq: .38, speed:  .08, dash: false }
  ];

  // тела на орбитах: ring, начальный угол, тип, размер
  const ALL_BODIES = [
    { ring: 0, a: 0.4, kind: 'disc',  s: 15 },
    { ring: 0, a: 3.6, kind: 'dot',   s: 3.5, comet: true },
    { ring: 1, a: 1.2, kind: 'note',  s: 24, g: '♪' },
    { ring: 1, a: 4.4, kind: 'cover', s: 20, hue: 0 },
    { ring: 2, a: 2.5, kind: 'note',  s: 30, g: '♫' },
    { ring: 2, a: 5.4, kind: 'disc',  s: 21 },
    { ring: 2, a: 0.1, kind: 'dot',   s: 4.5, comet: true },
    { ring: 3, a: 0.9, kind: 'cover', s: 26, hue: 1 },
    { ring: 3, a: 3.3, kind: 'note',  s: 26, g: '♪' },
    { ring: 3, a: 5.0, kind: 'dot',   s: 3,   comet: true },
    { ring: 4, a: 2.0, kind: 'disc',  s: 28 },
    { ring: 4, a: 4.2, kind: 'cover', s: 30, hue: 2 },
    { ring: 4, a: 5.8, kind: 'note',  s: 34, g: '♫' }
  ];
  let rings = ALL_RINGS, bodies = ALL_BODIES, lite = false;
  const sb = v => (lite ? 0 : v);
  const covers = [['#7dd8b2', '#285a48'], ['#a5cbb0', '#305c4c'], ['#b1d5b6', '#446c5c']];

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, unit = 0;
  let mx = 0, my = 0, tx = 0, ty = 0, running = true, last = 0, time = 0;

  const isLight = () => document.body.classList.contains('light');
  // палитра следует за настроением сайта (--hs / --ss из CSS)
  const rootEl = document.documentElement, cs = getComputedStyle(rootEl);
  let HS = 0, SS = 1, AC = [110, 219, 188];
  function shiftRGB([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0, l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = ((h * 60 + HS) % 360 + 360) % 360; s = Math.min(1, s * SS);
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [Math.round((R + m) * 255), Math.round((G + m) * 255), Math.round((B + m) * 255)];
  }
  const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const sh = h => `rgb(${shiftRGB(hexRGB(h)).join(',')})`;
  const updateColors = () => {
    HS = parseFloat(cs.getPropertyValue('--hs')) || 0; SS = parseFloat(cs.getPropertyValue('--ss')) || 1;
    AC = shiftRGB(isLight() ? [38, 140, 108] : [110, 219, 188]);
  };
  const col = a => `rgba(${AC[0]},${AC[1]},${AC[2]},${a})`;

  // слабые устройства: телефоны, мало ядер/памяти, экономия трафика
  function setLite() {
    if (lite) return; lite = true; rootEl.classList.add('lite');
    const keep = [0, 2, 4];
    rings = keep.map(i => ALL_RINGS[i]);
    bodies = ALL_BODIES.filter(b => keep.includes(b.ring) && !b.comet).map(b => ({ ...b, ring: keep.indexOf(b.ring) }));
    resize();
  }
  const weak = innerWidth < 700 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 || (navigator.connection && navigator.connection.saveData);
  let perfFrames = 0, perfSum = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 900;
    unit = narrow ? W * 0.95 : Math.min(W * 0.74, 1100);
    cx = narrow ? W * 0.5 : W * 0.58;
    cy = narrow ? H * 0.62 : H * 0.5;
  }

  // точка на эллиптической орбите с учётом наклона и параллакса
  function pos(ring, a, depthShift) {
    const R = ring.r * unit;
    const x = Math.cos(a) * R, y = Math.sin(a) * R * ring.sq;
    const cos = Math.cos(ring.tilt), sin = Math.sin(ring.tilt);
    const px = (mx * 26) * (0.4 + ring.r), py = (my * 16) * (0.4 + ring.r);
    return { x: cx + x * cos - y * sin + px, y: cy + x * sin + y * cos + py, z: (Math.sin(a) + 1) / 2 };
  }

  function drawRing(ring) {
    const R = ring.r * unit;
    const px = (mx * 26) * (0.4 + ring.r), py = (my * 16) * (0.4 + ring.r);
    ctx.save();
    ctx.setLineDash(ring.dash ? [3, 9] : []);
    ctx.lineWidth = 1;
    ctx.strokeStyle = col(ring.dash ? 0.3 : 0.2);
    ctx.beginPath();
    ctx.ellipse(cx + px, cy + py, R, R * ring.sq, ring.tilt, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawBody(b, p, rot) {
    const d = p.z, k = 0.7 + 0.65 * d, al = 0.4 + 0.6 * d, s = b.s * 1.25 * k;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = al;
    if (b.kind === 'note') {
      ctx.font = `700 ${s * 1.5}px Manrope, system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = col(.9); ctx.shadowBlur = sb(18 * d);
      ctx.fillStyle = col(.95);
      ctx.rotate(Math.sin(rot) * 0.25);
      ctx.fillText(b.g, 0, 0);
    } else if (b.kind === 'disc') {
      ctx.rotate(rot);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
      g.addColorStop(0, sh(isLight() ? '#dcece2' : '#1b2922'));
      g.addColorStop(1, sh(isLight() ? '#c4dccd' : '#0f1612'));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
      ctx.strokeStyle = col(.55); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.stroke();
      ctx.strokeStyle = col(.22);
      ctx.beginPath(); ctx.arc(0, 0, s * .68, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * .45, 0, TAU); ctx.stroke();
      ctx.fillStyle = col(.9); ctx.beginPath(); ctx.arc(0, 0, s * .22, 0, TAU); ctx.fill();
      // блик, чтобы было видно вращение
      ctx.strokeStyle = col(.7); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, s * .82, -.5, .3); ctx.stroke();
    } else if (b.kind === 'cover') {
      ctx.rotate(rot * 0.5);
      const [c1, c2] = covers[b.hue];
      const g = ctx.createLinearGradient(-s, -s, s, s);
      g.addColorStop(0, sh(c1)); g.addColorStop(1, sh(c2));
      ctx.shadowColor = col(.5); ctx.shadowBlur = sb(16 * d);
      ctx.fillStyle = g; roundRect(-s, -s, s * 2, s * 2, s * .28); ctx.fill();
      ctx.shadowBlur = sb(0);
      { const dk = shiftRGB([16, 32, 25]); ctx.fillStyle = `rgba(${dk.join(',')},.55)`; }
      ctx.fillRect(-s * .5, s * .15, s * .22, s * .5);
      ctx.fillRect(-s * .12, -s * .2, s * .22, s * .85);
      ctx.fillRect(s * .26, s * .0, s * .22, s * .65);
    } else {
      ctx.shadowColor = col(1); ctx.shadowBlur = sb(14);
      ctx.fillStyle = col(1);
      ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // хвост кометы — след на орбите позади точки
  function drawTail(b, ring, a) {
    const dir = ring.speed > 0 ? -1 : 1, steps = 22;
    let prev = pos(ring, a, 0);
    for (let i = 1; i <= steps; i++) {
      const p = pos(ring, a + dir * i * 0.028, 0);
      ctx.strokeStyle = col((1 - i / steps) * 0.55 * (0.3 + 0.7 * p.z));
      ctx.lineWidth = Math.max(0.6, b.s * (0.62 + 0.55 * p.z) * (1 - i / steps) * 1.1);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      prev = p;
    }
  }

  function frame(now) {
    if (!running) return;
    if (lite && now - last < 33) { if (!reduce) requestAnimationFrame(frame); return; }  // ~30 fps в облегчённом режиме
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!lite && perfFrames < 90 && !reduce) {  // если кадры тяжёлые — переходим на облегчённый режим
      perfSum += now - (frame.prev || now); frame.prev = now; perfFrames++;
      if (perfFrames === 90 && perfSum / 90 > 34) setLite();
    }
    updateColors();
    if (!reduce) time += dt;
    tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;

    ctx.clearRect(0, 0, W, H);
    // мягкое свечение в центре системы
    const glow = ctx.createRadialGradient(cx + mx * 20, cy + my * 12, 0, cx, cy, unit * 0.55);
    glow.addColorStop(0, col(isLight() ? 0.12 : 0.13)); glow.addColorStop(1, col(0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    rings.forEach(drawRing);

    const list = bodies.map(b => {
      const ring = rings[b.ring];
      const a = b.a + time * ring.speed;
      return { b, ring, a, p: pos(ring, a, 0) };
    }).sort((u, v) => u.p.z - v.p.z);

    list.forEach(o => {
      if (o.b.comet) drawTail(o.b, o.ring, o.a);
      drawBody(o.b, o.p, o.a * 2 + time * 0.6);
    });

    if (!reduce) requestAnimationFrame(frame);
  }

  function start() {
    running = true; last = performance.now();
    if (reduce) { frame(last); } else requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => { resize(); if (reduce) frame(performance.now()); });
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) start();
    else if (!e.isIntersecting) running = false;
  }).observe(canvas);
  document.getElementById('themeToggle')?.addEventListener('click', () => { if (reduce) setTimeout(() => frame(performance.now()), 0); });

  if (weak) setLite();
  resize();
  start();
})();
