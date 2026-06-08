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

import { BRACKET_WEIGHTS, scoreBracket, championOf } from './prediction-scoring.js';

const ko = (stage, winner) => ({ stage, status: 'finished', winner });

describe('scoreBracket', () => {
  it('doğru kazanan, tur ağırlığı kadar puan', () => {
    expect(scoreBracket('BRA', ko('qf', 'BRA'))).toBe(BRACKET_WEIGHTS.qf);
    expect(scoreBracket('BRA', ko('final', 'BRA'))).toBe(8);
  });
  it('yanlış kazanan = 0', () => expect(scoreBracket('ARG', ko('qf', 'BRA'))).toBe(0));
  it('bitmemiş / kazanansız = 0', () => {
    expect(scoreBracket('BRA', { stage: 'qf', status: 'scheduled', winner: null })).toBe(0);
  });
});

describe('championOf', () => {
  it('bitmiş finalin kazananını döner', () => {
    const matches = [ko('sf', 'BRA'), { id: 1, stage: 'final', status: 'finished', winner: 'BRA' }];
    expect(championOf(matches)).toBe('BRA');
  });
  it('final bitmemişse null', () => {
    expect(championOf([{ stage: 'final', status: 'scheduled', winner: null }])).toBeNull();
  });
});

import { computePredictionScore } from './prediction-scoring.js';

describe('computePredictionScore', () => {
  const matches = [
    { id: 'm1', stage: 'group', status: 'finished', homeScore: 2, awayScore: 1, winner: 'A' },
    { id: 'm2', stage: 'group', status: 'scheduled', homeScore: null, awayScore: null, winner: null },
    { id: 'k1', stage: 'qf', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A' },
    { id: 'f1', stage: 'final', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A' },
  ];
  const predictions = {
    matchScores: { m1: { home: 2, away: 1 }, m2: { home: 1, away: 1 } },
    bracketPicks: { k1: 'A' },
    champion: 'A',
  };

  it('maç, bracket ve şampiyon puanlarını toplar', () => {
    const s = computePredictionScore(predictions, matches);
    expect(s.matchPoints).toBe(5);
    expect(s.bracketPoints).toBe(4);
    expect(s.championPoints).toBe(10);
    expect(s.total).toBe(19);
    expect(s.scoredCount).toBe(1);
    expect(s.correctCount).toBe(1);
    expect(s.exactCount).toBe(1);
    expect(s.best).toEqual({ matchId: 'm1', points: 5 });
  });
});
