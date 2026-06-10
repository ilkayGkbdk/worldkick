import { writable } from 'svelte/store';
import { toggleTier as applyTier } from '../utils/bracket-rules.js';

const KEY = 'wk-predictions';
const EMPTY = { matchScores: {}, bracket: { r16: [], qf: [], sf: [], final: [] }, champion: null };

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v === 'object') {
      return {
        matchScores: v.matchScores ?? {},
        bracket: { r16: [], qf: [], sf: [], final: [], ...(v.bracket ?? {}) },
        champion: v.champion ?? null,
      };
    }
  } catch {}
  return structuredClone(EMPTY);
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
    toggleTier(tier, teamId) {
      update((s) => {
        const bracket = applyTier(s.bracket, tier, teamId);
        const champion = bracket.final.includes(s.champion) ? s.champion : null;
        const n = { ...s, bracket, champion };
        persist(n); return n;
      });
    },
    setChampion(teamId) {
      update((s) => {
        if (!s.bracket.final.includes(teamId)) return s;
        const n = { ...s, champion: teamId }; persist(n); return n;
      });
    },
  };
}

export const predictions = createPredictions();
