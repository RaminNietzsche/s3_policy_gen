const THEME_KEY = 'arvan_policy_theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButton(theme);
}

export function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function updateThemeButton(theme) {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isDark = theme === 'dark';
  btn.setAttribute('aria-label', isDark ? 'پوستهٔ روشن' : 'پوستهٔ تیره');
  btn.title = isDark ? 'رفتن به پوستهٔ روشن' : 'رفتن به پوستهٔ تیره';
}

export function initTheme() {
  updateThemeButton(getTheme());
  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
}
