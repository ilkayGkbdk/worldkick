import { describe, it, expect } from 'vitest';
import { teamColor, DEFAULT_ACCENT } from './team-colors.js';

describe('teamColor', () => {
  it('bilinen takım için renk döner', () => {
    expect(teamColor('BRA')).toBe('#1E9E4A');
    expect(teamColor('TUR')).toBe('#E30A17');
  });
  it('bilinmeyen takım için null döner', () => {
    expect(teamColor('ZZZ')).toBeNull();
  });
  it('varsayılan aksan tanımlı', () => {
    expect(DEFAULT_ACCENT).toBe('#ff2e63');
  });
});
