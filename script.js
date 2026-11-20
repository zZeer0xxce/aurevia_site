const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const mobileMenu = document.getElementById('mobileMenu');
const navLinks = document.getElementById('navLinks');
const toast = document.getElementById('toast');

themeToggle.addEventListener('click', () => {
  body.classList.toggle('light');
  const isLight = body.classList.contains('light');
  themeToggle.innerHTML = isLight ? '☾' : '☼';
  document.querySelector('meta[name="theme-color"]').content = isLight ? '#edf5f0' : '#101714';
});

mobileMenu.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('open')));

const platformButtons = [...document.querySelectorAll('.platform-button')];
const downloadCaption = document.getElementById('downloadCaption');
const downloadButton = document.getElementById('downloadButton');
let selectedPlatform = 'Windows';

platformButtons.forEach(button => {
  button.addEventListener('click', () => {
    platformButtons.forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    selectedPlatform = button.dataset.platform;
    const status = selectedPlatform === 'Windows' ? 'Установщик пока не опубликован' : 'Поддержка платформы пока не подтверждена';
    downloadCaption.textContent = `Выбрана платформа ${selectedPlatform} · ${status}`;
    downloadButton.innerHTML = 'Скоро будет доступно <span>↗</span>';
  });
});

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
downloadButton.addEventListener('click', () => {
  showToast(`Aurevia для ${selectedPlatform} пока готовится к выпуску. Следите за обновлениями!`);
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) other.open = false;
      });
    }
  });
});
