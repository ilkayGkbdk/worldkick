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

import { isMatchPredictable, isBracketPredictable, isChampionLocked } from './prediction-scoring.js';

describe('uygunluk', () => {
  const now = Date.parse('2026-06-11T12:00:00Z');
  const future = { datetimeUTC: '2026-06-11T20:00:00Z' };
  const past = { datetimeUTC: '2026-06-11T09:00:00Z' };
  const teams = [{ id: 'A' }, { id: 'B' }];

  it('isMatchPredictable: başlamadıysa true', () => {
    expect(isMatchPredictable(future, now)).toBe(true);
    expect(isMatchPredictable(past, now)).toBe(false);
  });
  it('isBracketPredictable: eleme + iki takım bilinir + başlamamış', () => {
    expect(isBracketPredictable({ stage: 'r16', homeId: 'A', awayId: 'B', datetimeUTC: future.datetimeUTC }, teams, now)).toBe(true);
    expect(isBracketPredictable({ stage: 'r16', homeId: 'A', awayId: 'Z', datetimeUTC: future.datetimeUTC }, teams, now)).toBe(false);
    expect(isBracketPredictable({ stage: 'group', homeId: 'A', awayId: 'B', datetimeUTC: future.datetimeUTC }, teams, now)).toBe(false);
  });
  it('isChampionLocked: ilk r32 başladıysa true', () => {
    const matches = [{ stage: 'r32', datetimeUTC: '2026-06-28T18:00:00Z' }];
    expect(isChampionLocked(matches, Date.parse('2026-06-28T19:00:00Z'))).toBe(true);
    expect(isChampionLocked(matches, Date.parse('2026-06-28T17:00:00Z'))).toBe(false);
  });
});
