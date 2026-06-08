import { describe, it, expect } from 'vitest';
import { formatLocalTime, formatLocalDate, isSameLocalDay } from './datetime.js';

describe('datetime', () => {
  it('formatLocalTime ISO UTC stringini HH:MM döndürür', () => {
    const out = formatLocalTime('2026-06-11T20:00:00Z', 'tr-TR', 'UTC');
    expect(out).toBe('20:00');
  });

  it('formatLocalDate gün ve kısa ay döndürür', () => {
    const out = formatLocalDate('2026-06-11T20:00:00Z', 'tr-TR', 'UTC');
    expect(out).toMatch(/11/);
  });

  it('isSameLocalDay aynı takvim günü için true döner', () => {
    const ref = new Date('2026-06-11T08:00:00Z');
    expect(isSameLocalDay('2026-06-11T23:00:00Z', ref, 'UTC')).toBe(true);
    expect(isSameLocalDay('2026-06-12T01:00:00Z', ref, 'UTC')).toBe(false);
  });
});
