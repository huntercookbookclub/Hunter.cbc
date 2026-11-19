import { useSyncExternalStore } from 'react';

// Light / dark / auto. Auto (default) follows the device's setting. The choice is
// saved on this device; index.html applies it before first paint (no flash).
// CSS colors come in pairs via light-dark(), switched by `color-scheme` (index.css).
const KEY = 'theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

export function getThemeChoice() {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'auto';
  } catch {
    return 'auto';
  }
}

export const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : media.matches;
};

// Browser bar / status bar color. A page can lock it (the recipe book's brown).
export function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && !meta.dataset.locked) meta.content = isDark() ? '#202024' : '#ffffff';
}

export function setThemeChoice(choice) {
  try {
    if (choice === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    /* private mode: still applies for this visit */
  }
  if (choice === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
  syncThemeColor();
  window.dispatchEvent(new Event('themechange'));
}

media.addEventListener('change', syncThemeColor);
syncThemeColor();

function subscribe(cb) {
  media.addEventListener('change', cb);
  window.addEventListener('themechange', cb);
  return () => {
    media.removeEventListener('change', cb);
    window.removeEventListener('themechange', cb);
  };
}

export const useIsDark = () => useSyncExternalStore(subscribe, isDark);
export const useThemeChoice = () => useSyncExternalStore(subscribe, getThemeChoice);
