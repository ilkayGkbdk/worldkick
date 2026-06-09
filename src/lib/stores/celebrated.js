import { writable } from 'svelte/store';

const KEY = 'wk-celebrated';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function createCelebrated() {
  const { subscribe, update } = writable(load());
  return {
    subscribe,
    markSeen(ids) {
      update((list) => {
        const next = [...new Set([...list, ...ids.map(String)])];
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
  };
}

export const celebrated = createCelebrated();
