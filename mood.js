/* Mood Flow: стиль сайта зависит от времени суток (GMT+3) и текст «подборки» в макете плеера */
(() => {
  const root = document.documentElement;
  const KEY = 'aurevia-mood';
  const chip = document.getElementById('moodChip');
  const label = document.getElementById('moodLabel');
  const meta = document.querySelector('meta[name="theme-color"]');

  const NAMES = { dawn: 'Рассвет', day: 'День', night: 'Ночь' };
  const THEME = { dawn: '#1a1210', day: '#101714', night: '#0b121c' };
  const TEXT = {
    dawn: { greet: 'Доброе утро', sub: 'Начни день с хорошей музыки', kicker: 'УТРЕННЯЯ ПОДБОРКА',
      title: 'Проснись<br>вместе с музыкой.', desc: 'Мягкий старт для нового дня.',
      a1t: 'Morning light', a1s: 'Тихое пробуждение', a2t: 'Coffee time', a2s: 'Утренний кофе', a3t: 'Fresh start', a3s: 'Заряд на день' },
    night: { greet: 'Тихая ночь', sub: 'Музыка для поздних часов', kicker: 'НОЧНАЯ ПОДБОРКА',
      title: 'Расслабься.<br>Ночь твоя.', desc: 'Спокойные треки для тишины.',
      a1t: 'Midnight', a1s: 'Ночная тишина', a2t: 'Deep focus', a2s: 'Сосредоточение', a3t: 'Moonlight', a3s: 'Лунный свет' }
  };
  // тексты «дня» берём прямо из разметки
  const nodes = {};
  document.querySelectorAll('[data-m]').forEach(n => { nodes[n.dataset.m] = n; });
  TEXT.day = {};
  Object.keys(nodes).forEach(k => { TEXT.day[k] = nodes[k].innerHTML; });

  const auto = () => { const h = (new Date().getUTCHours() + 3) % 24; return h >= 6 && h < 8 ? 'dawn' : h >= 8 && h < 22 ? 'day' : 'night'; };
  const ORDER = ['auto', 'dawn', 'day', 'night'];
  let pref = 'auto';
  try { pref = localStorage.getItem(KEY) || 'auto'; } catch (e) {}
  if (!ORDER.includes(pref)) pref = 'auto';

  function swapText(mood, instant) {
    const t = TEXT[mood];
    Object.keys(nodes).forEach((k, i) => {
      const n = nodes[k];
      if (n.innerHTML === t[k]) return;
      if (instant) { n.innerHTML = t[k]; return; }
      n.classList.add('swap-out');
      setTimeout(() => { n.innerHTML = t[k]; n.classList.remove('swap-out'); }, 280 + i * 40);
    });
  }

  function apply(instant) {
    const mood = pref === 'auto' ? auto() : pref;
    if (root.getAttribute('data-mood') !== mood) root.setAttribute('data-mood', mood);
    root.dataset.moodPref = pref;
    if (meta && !document.body.classList.contains('light')) meta.content = THEME[mood];
    label.textContent = pref === 'auto' ? 'Авто · ' + NAMES[mood] : NAMES[mood];
    chip.title = 'Настроение сайта: нажми, чтобы сменить (Авто → Рассвет → День → Ночь)';
    swapText(mood, instant);
  }

  chip.addEventListener('click', () => {
    pref = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    try { localStorage.setItem(KEY, pref); } catch (e) {}
    apply(false);
  });
  setInterval(() => { if (pref === 'auto') apply(false); }, 30000);
  apply(true);
})();
