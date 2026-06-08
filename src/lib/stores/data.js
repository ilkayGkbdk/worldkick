import { writable } from 'svelte/store';
import { loadJSON } from '../data/load.js';

export const teams = writable([]);
export const matches = writable([]);
export const meta = writable(null);
export const loadError = writable(null);

export async function loadAll() {
  try {
    const [t, m, me] = await Promise.all([
      loadJSON('teams'), loadJSON('matches'), loadJSON('meta'),
    ]);
    teams.set(t); matches.set(m); meta.set(me);
  } catch (err) {
    loadError.set(err.message);
  }
}

export function teamById(list, id) {
  return list.find((t) => t.id === id) ?? null;
}

export function matchById(list, id) {
  return list.find((m) => String(m.id) === String(id)) ?? null;
}
