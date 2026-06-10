import { describe, it, expect } from 'vitest';
import { scoreMatch } from './prediction-scoring.js';

const fin = (h, a) => ({ status: 'finished', homeScore: h, awayScore: a });

describe('scoreMatch', () => {
  it('tam skor = 5', () => expect(scoreMatch({ home: 2, away: 1 }, fin(2, 1))).toBe(5));
  it('doğru averaj (tam değil) = 3', () => expect(scoreMatch({ home: 2, away: 1 }, fin(3, 2))).toBe(3));
  it('doğru beraberlik averajı = 3', () => expect(scoreMatch({ home: 1, away: 1 }, fin(2, 2))).toBe(3));
  it('doğru sonuç (averaj farklı) = 2', () => expect(scoreMatch({ home: 3, away: 1 }, fin(1, 0))).toBe(2));
  it('yanlış = 0', () => expect(scoreMatch({ home: 0, away: 2 }, fin(1, 0))).toBe(0));
  it('bitmemiş maç = 0', () => expect(scoreMatch({ home: 1, away: 0 }, { status: 'scheduled', homeScore: null, awayScore: null })).toBe(0));
  it('tahmin yok = 0', () => expect(scoreMatch(null, fin(1, 0))).toBe(0));
});

import { computePredictionScore } from './prediction-scoring.js';

describe('computePredictionScore', () => {
  const matches = [
    { id: 'm1', stage: 'group', status: 'finished', homeScore: 2, awayScore: 1, winner: 'A' },
    { id: 'k1', stage: 'qf', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A', homeId: 'A', awayId: 'B' },
    { id: 'f1', stage: 'final', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A', homeId: 'A', awayId: 'C' },
  ];
  const predictions = {
    matchScores: { m1: { home: 2, away: 1 } },
    bracket: { r16: ['A'], qf: ['A'], sf: [], final: ['A'] },
    champion: 'A',
  };

  it('maç + bracket-ağaç + şampiyon puanlarını toplar', () => {
    const s = computePredictionScore(predictions, matches);
    expect(s.matchPoints).toBe(5);
    expect(s.bracketPoints).toBe(8);
    expect(s.championPoints).toBe(10);
    expect(s.total).toBe(23);
    expect(s.scoredCount).toBe(1);
    expect(s.exactCount).toBe(1);
    expect(s.best).toEqual({ matchId: 'm1', points: 5 });
  });
});
