import { writable } from 'svelte/store';

const KEY = 'wk-favorites';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function createFavorites() {
  const { subscribe, update } = writable(load());
  function persist(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  return {
    subscribe,
    toggle(id) {
      update((list) => {
        const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
        persist(next);
        return next;
      });
    },
  };
}

export const favorites = createFavorites();
