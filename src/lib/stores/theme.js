import { writable } from 'svelte/store';

const KEY = 'wk-theme';
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function resolve(value) {
  return value === 'system' ? (mql.matches ? 'dark' : 'light') : value;
}

function createTheme() {
  const initial = localStorage.getItem(KEY) || 'system';
  const { subscribe, set } = writable(initial);

  function apply(value) {
    document.documentElement.dataset.theme = resolve(value);
  }
  apply(initial);
  mql.addEventListener('change', () => {
    if ((localStorage.getItem(KEY) || 'system') === 'system') apply('system');
  });

  return {
    subscribe,
    set(value) {
      localStorage.setItem(KEY, value);
      apply(value);
      set(value);
    },
  };
}

export const theme = createTheme();
