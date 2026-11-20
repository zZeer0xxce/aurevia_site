/* Дополнительная интерактивность v4 */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // манифест: слова загораются по мере прокрутки
  const mani = document.getElementById('manifesto');
  if (mani) {
    mani.innerHTML = mani.textContent.trim().split(/\s+/).map(w => `<span class="word">${w}</span>`).join(' ');
  }
  const words = mani ? [...mani.querySelectorAll('.word')] : [];
  const roadmap = document.querySelector('.roadmap');
  const markers = roadmap ? [...roadmap.querySelectorAll('.roadmap-marker')] : [];
  const bar = document.getElementById('scrollBar');

  function onScroll() {
    const vh = innerHeight;
    bar.style.transform = `scaleX(${clamp(scrollY / (document.documentElement.scrollHeight - vh), 0, 1)})`;
    if (mani) {
      const r = mani.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (roadmap) {
      const r = roadmap.getBoundingClientRect();
      const fill = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
      roadmap.style.setProperty('--fill', (fill * 100).toFixed(1) + '%');
      markers.forEach(m => m.classList.toggle('lit', m.getBoundingClientRect().top < vh * 0.65));
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // подсветка пункта меню по текущей секции
  const links = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

  // свет под курсором + лёгкий 3D-наклон карточек
  document.querySelectorAll('.feature-card,.echo-card,.platform-button,.roadmap-item').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
      if (el.classList.contains('feature-card') && !reduce && el.classList.contains('visible')) {
        el.style.transition = 'transform .12s, border-color .3s';
        el.style.transform = `perspective(900px) rotateX(${((y / r.height) - .5) * -5}deg) rotateY(${((x / r.width) - .5) * 6}deg) translateY(-4px)`;
      }
    });
    el.addEventListener('mouseleave', () => { el.style.transition = ''; el.style.transform = ''; });
  });

  // «печатающийся» поиск
  const typed = document.getElementById('typed');
  if (typed && !reduce) {
    const phrases = ['Найти что-то новое', 'Вечерний джаз', 'Музыка для дороги', 'Что-то спокойное', 'Мой плейлист на утро'];
    let pi = 0, ci = phrases[0].length, del = true;
    (function tick() {
      const t = phrases[pi];
      if (del) { ci--; if (ci <= 0) { del = false; pi = (pi + 1) % phrases.length; } }
      else { ci++; if (ci >= phrases[pi].length) { del = true; typed.textContent = phrases[pi]; return setTimeout(tick, 1700); } }
      typed.textContent = phrases[pi].slice(0, Math.max(ci, 0));
      setTimeout(tick, del ? 35 : 75);
    })();
    setTimeout(() => {}, 0);
  }

  // волна в секции «Моё эхо»
  const wave = document.getElementById('wave');
  if (wave) {
    for (let i = 0; i < 70; i++) {
      const b = document.createElement('i');
      b.style.setProperty('--h', (18 + Math.abs(Math.sin(i * 0.5) * 40) + Math.random() * 30).toFixed(0) + 'px');
      b.style.setProperty('--d', (-Math.random() * 2).toFixed(2) + 's');
      wave.appendChild(b);
    }
  }
})();

/* v5: бегущие строки с чипами и экран загрузки */
(() => {
  document.querySelectorAll('.chip-row').forEach(row => {
    const g = row.querySelector('.chip-group');
    if (!g) return;
    const c = g.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.appendChild(c);
  });
  const loader = document.getElementById('loader');
  const hide = () => {
    if (!loader || !document.body.classList.contains('loading')) return;
    document.body.classList.remove('loading'); loader.classList.add('done');
    setTimeout(() => loader.remove(), 900);
  };
  const minShow = matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 1300;
  const t0 = performance.now();
  const ready = () => setTimeout(hide, Math.max(0, minShow - (performance.now() - t0)));
  if (document.readyState === 'complete') ready(); else addEventListener('load', ready);
  setTimeout(hide, 4000); // страховка
})();
