import { describe, it, expect } from 'vitest';
import { computeStandings } from './standings.js';

const teams = [
  { id: 'A1', group: 'A' }, { id: 'A2', group: 'A' }, { id: 'A3', group: 'A' },
  { id: 'B1', group: 'B' }, { id: 'B2', group: 'B' },
  { id: 'X', group: '?' },
];
const matches = [
  { id: 1, stage: 'group', group: 'A', homeId: 'A1', awayId: 'A2', status: 'finished', homeScore: 2, awayScore: 1 },
  { id: 2, stage: 'group', group: 'A', homeId: 'A2', awayId: 'A3', status: 'finished', homeScore: 0, awayScore: 0 },
  { id: 3, stage: 'group', group: 'A', homeId: 'A1', awayId: 'A3', status: 'scheduled', homeScore: null, awayScore: null },
  { id: 4, stage: 'r32', group: null, homeId: 'A1', awayId: 'B1', status: 'finished', homeScore: 3, awayScore: 0 },
];

describe('computeStandings', () => {
  it('bitmiş grup maçlarından puan durumunu hesaplar ve sıralar', () => {
    const result = computeStandings(matches, teams);
    const groupA = result.find((g) => g.group === 'A');
    expect(groupA.rows.map((r) => r.teamId)).toEqual(['A1', 'A3', 'A2']);
    expect(groupA.rows[0]).toMatchObject({ teamId: 'A1', P: 1, W: 1, D: 0, L: 0, GF: 2, GA: 1, GD: 1, Pts: 3 });
    expect(groupA.rows.find((r) => r.teamId === 'A2')).toMatchObject({ P: 2, W: 0, D: 1, L: 1, GF: 1, GA: 2, GD: -1, Pts: 1 });
    expect(groupA.rows.find((r) => r.teamId === 'A3')).toMatchObject({ P: 1, D: 1, GF: 0, GA: 0, GD: 0, Pts: 1 });
  });

  it("'?' grubunu ve grup-dışı (eleme) maçları yok sayar", () => {
    const result = computeStandings(matches, teams);
    expect(result.map((g) => g.group)).toEqual(['A', 'B']);
    const a1 = result.find((g) => g.group === 'A').rows.find((r) => r.teamId === 'A1');
    expect(a1.GA).toBe(1);
  });
});
