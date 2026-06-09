import { describe, it, expect } from 'vitest';
import { pendingCelebrations } from './celebrate.js';

const matches = [
  { id: 1, status: 'finished', winner: 'BRA' },
  { id: 2, status: 'finished', winner: 'ARG' },
  { id: 3, status: 'finished', winner: null },
  { id: 4, status: 'live', winner: null },
  { id: 5, status: 'scheduled', winner: null },
];

describe('pendingCelebrations', () => {
  it('favori takımın kutlanmamış galibiyetlerini döner', () => {
    expect(pendingCelebrations(matches, ['BRA'], [])).toEqual(['1']);
  });
  it('zaten kutlanmışları hariç tutar', () => {
    expect(pendingCelebrations(matches, ['BRA'], ['1'])).toEqual([]);
  });
  it('favori olmayan / berabere / bitmemiş maçları saymaz', () => {
    expect(pendingCelebrations(matches, ['TUR'], [])).toEqual([]);
    expect(pendingCelebrations(matches, ['BRA', 'ARG'], [])).toEqual(['1', '2']);
  });
});
