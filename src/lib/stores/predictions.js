import { writable } from 'svelte/store';

const KEY = 'wk-predictions';
const EMPTY = { matchScores: {}, bracketPicks: {}, champion: null };

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v === 'object') return { ...EMPTY, ...v };
  } catch {}
  return { ...EMPTY };
}

function createPredictions() {
  const { subscribe, update } = writable(load());
  const persist = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  return {
    subscribe,
    setMatchScore(id, home, away) {
      update((s) => { const n = { ...s, matchScores: { ...s.matchScores, [id]: { home, away } } }; persist(n); return n; });
    },
    clearMatchScore(id) {
      update((s) => { const ms = { ...s.matchScores }; delete ms[id]; const n = { ...s, matchScores: ms }; persist(n); return n; });
    },
    setBracketPick(id, teamId) {
      update((s) => { const n = { ...s, bracketPicks: { ...s.bracketPicks, [id]: teamId } }; persist(n); return n; });
    },
    setChampion(teamId) {
      update((s) => { const n = { ...s, champion: teamId }; persist(n); return n; });
    },
  };
}

export const predictions = createPredictions();
