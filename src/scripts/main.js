const root = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let preference;
try {
  const saved = localStorage.getItem('ziyang-theme');
  if (saved === 'light' || saved === 'dark') preference = saved;
} catch { /* Private browsing may block storage. Keep system preference. */ }

function updateTheme() {
  const theme = preference ?? (systemTheme.matches ? 'dark' : 'light');
  root.dataset.theme = theme;
  const label = theme === 'dark' ? '切换浅色' : '切换深色';
  themeButton.textContent = label;
  themeButton.title = label;
  themeButton.setAttribute('aria-label', label);
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#141c18' : '#f5f3ed';
}
updateTheme();
themeButton.hidden = false;
themeButton.addEventListener('click', () => {
  preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
  updateTheme();
  try { localStorage.setItem('ziyang-theme', preference); } catch { /* Theme still works for this visit. */ }
});
systemTheme.addEventListener('change', () => { if (!preference) updateTheme(); });

const copyButton = document.querySelector('#copy-email');
const status = document.querySelector('#copy-status');
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.querySelector('#email').textContent.trim());
    status.textContent = '邮箱已复制';
  } catch {
    status.textContent = '无法自动复制，请选中邮箱手动复制，或点击邮箱发送邮件。';
  }
});
