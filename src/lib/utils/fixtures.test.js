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

import { getMatchdays, filterByGroup, getTeamMatches } from './fixtures.js';

describe('getMatchdays', () => {
  const ms = [
    { id: 1, datetimeUTC: '2026-06-11T20:00:00Z' },
    { id: 3, datetimeUTC: '2026-06-12T18:00:00Z' },
    { id: 2, datetimeUTC: '2026-06-11T23:00:00Z' },
  ];
  it('maçları güne göre gruplar, günleri ve maçları artan sıralar', () => {
    const days = getMatchdays(ms, 'UTC');
    expect(days.map((d) => d.key)).toEqual(['2026-06-11', '2026-06-12']);
    expect(days[0].matches.map((m) => m.id)).toEqual([1, 2]);
    expect(days[1].matches.map((m) => m.id)).toEqual([3]);
  });
});

describe('filterByGroup', () => {
  const ms = [
    { id: 1, group: 'A' }, { id: 2, group: 'F' }, { id: 3, group: 'A' },
  ];
  it('boş grup ile tüm maçları döner', () => {
    expect(filterByGroup(ms, '').map((m) => m.id)).toEqual([1, 2, 3]);
  });
  it('verilen gruba ait maçları döner', () => {
    expect(filterByGroup(ms, 'A').map((m) => m.id)).toEqual([1, 3]);
  });
});

describe('getTeamMatches', () => {
  const ms = [
    { id: 1, homeId: 'X', awayId: 'Y', datetimeUTC: '2026-06-12T18:00:00Z' },
    { id: 2, homeId: 'Z', awayId: 'X', datetimeUTC: '2026-06-11T18:00:00Z' },
    { id: 3, homeId: 'Y', awayId: 'Z', datetimeUTC: '2026-06-10T18:00:00Z' },
  ];
  it('takımın yer aldığı maçları zaman sırasıyla döner', () => {
    expect(getTeamMatches(ms, 'X').map((m) => m.id)).toEqual([2, 1]);
  });
});
