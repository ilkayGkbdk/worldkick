import { describe, it, expect } from 'vitest';
import { getNextMatch, getMatchesOn } from './fixtures.js';

const matches = [
  { id: 1, datetimeUTC: '2026-06-11T20:00:00Z' },
  { id: 2, datetimeUTC: '2026-06-11T23:00:00Z' },
  { id: 3, datetimeUTC: '2026-06-12T18:00:00Z' },
];

describe('fixtures', () => {
  it('getNextMatch şu andan sonraki en erken maçı döner', () => {
    const now = Date.parse('2026-06-11T21:00:00Z');
    expect(getNextMatch(matches, now).id).toBe(2);
  });

  it('gelecekte maç yoksa null döner', () => {
    const now = Date.parse('2026-07-01T00:00:00Z');
    expect(getNextMatch(matches, now)).toBeNull();
  });

  it('getMatchesOn verilen güne ait maçları döner', () => {
    const ref = new Date('2026-06-11T10:00:00Z');
    const ids = getMatchesOn(matches, ref, 'UTC').map((m) => m.id);
    expect(ids).toEqual([1, 2]);
  });
});
