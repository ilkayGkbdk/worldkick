import { describe, it, expect } from 'vitest';
import { getCountdown } from './countdown.js';

describe('getCountdown', () => {
  it('hedefe kalan gün/saat/dakika/saniyeyi hesaplar', () => {
    const now = Date.UTC(2026, 5, 8, 0, 0, 0);
    const target = Date.UTC(2026, 5, 10, 14, 37, 5);
    expect(getCountdown(target, now)).toEqual({
      days: 2, hours: 14, minutes: 37, seconds: 5, done: false,
    });
  });

  it('hedef geçmişte ise sıfırlanır ve done=true olur', () => {
    const now = Date.UTC(2026, 5, 11, 0, 0, 0);
    const target = Date.UTC(2026, 5, 10, 0, 0, 0);
    expect(getCountdown(target, now)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0, done: true,
    });
  });
});
