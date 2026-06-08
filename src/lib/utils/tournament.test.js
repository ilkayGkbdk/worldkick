import { describe, it, expect } from 'vitest';
import { getBracketRounds } from './tournament.js';

const matches = [
  { id: 'f', stage: 'final', datetimeUTC: '2026-07-19T19:00:00Z' },
  { id: 'r1', stage: 'r32', datetimeUTC: '2026-06-28T18:00:00Z' },
  { id: 'r2', stage: 'r32', datetimeUTC: '2026-06-28T22:00:00Z' },
  { id: 'q', stage: 'qf', datetimeUTC: '2026-07-10T18:00:00Z' },
  { id: 'grp', stage: 'group', datetimeUTC: '2026-06-11T18:00:00Z' },
];

describe('getBracketRounds', () => {
  it('5 turu sabit sırada döner ve grup maçlarını dışlar', () => {
    const rounds = getBracketRounds(matches);
    expect(rounds.map((r) => r.stage)).toEqual(['r32', 'r16', 'qf', 'sf', 'final']);
    expect(rounds[0].matches.map((m) => m.id)).toEqual(['r1', 'r2']);
    expect(rounds.find((r) => r.stage === 'r16').matches).toEqual([]);
    expect(rounds.find((r) => r.stage === 'final').matches.map((m) => m.id)).toEqual(['f']);
  });
});
