import { describe, it, expect } from 'vitest';
import { mapStage, mapGroup, mapStatus, transformMatches } from './transform.mjs';

describe('mappers', () => {
  it('mapStage API stage kodlarını iç koda çevirir', () => {
    expect(mapStage('GROUP_STAGE')).toBe('group');
    expect(mapStage('LAST_16')).toBe('r16');
    expect(mapStage('FINAL')).toBe('final');
    expect(mapStage('SOMETHING_NEW')).toBe('group');
  });
  it('mapGroup GROUP_A → A, null → null', () => {
    expect(mapGroup('GROUP_A')).toBe('A');
    expect(mapGroup(null)).toBeNull();
  });
  it('mapStatus durumları sınıflandırır', () => {
    expect(mapStatus('FINISHED')).toBe('finished');
    expect(mapStatus('IN_PLAY')).toBe('live');
    expect(mapStatus('TIMED')).toBe('scheduled');
  });
});

describe('transformMatches', () => {
  const api = [
    {
      id: 100, utcDate: '2026-06-11T20:00:00Z', status: 'FINISHED',
      stage: 'GROUP_STAGE', group: 'GROUP_A', venue: 'Estadio Azteca',
      score: { winner: 'HOME_TEAM', fullTime: { home: 2, away: 1 } },
      homeTeam: { id: 1, name: 'Mexico', tla: 'MEX' },
      awayTeam: { id: 2, name: 'United States', tla: 'USA' },
    },
    {
      id: 200, utcDate: '2026-07-19T19:00:00Z', status: 'TIMED',
      stage: 'FINAL', group: null, venue: 'MetLife Stadium',
      score: { fullTime: { home: null, away: null } },
      homeTeam: { id: 1, name: 'Mexico', tla: 'MEX' },
      awayTeam: { id: 3, name: 'Brazil', tla: 'BRA' },
    },
  ];
  const meta = { MEX: { tr: 'Meksika', flag: 'mx' }, USA: { tr: 'ABD', flag: 'us' } };

  it('maçları iç şemaya çevirir', () => {
    const { matches } = transformMatches(api, meta);
    expect(matches[0]).toMatchObject({
      id: '100', stage: 'group', group: 'A', homeId: 'MEX', awayId: 'USA',
      datetimeUTC: '2026-06-11T20:00:00Z', venue: 'Estadio Azteca', city: '',
      status: 'finished', homeScore: 2, awayScore: 1, winner: 'MEX', scorers: [],
    });
    expect(matches[1]).toMatchObject({ id: '200', stage: 'final', group: null, status: 'scheduled', homeScore: null, awayScore: null });
    expect(matches[1].winner).toBeNull();
  });

  it('takımları toplar, meta tablosundan ad/bayrak uygular, grubu atar', () => {
    const { teams } = transformMatches(api, meta);
    const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
    expect(byId.MEX).toMatchObject({ id: 'MEX', name: 'Meksika', code: 'MEX', group: 'A', flag: 'mx' });
    expect(byId.USA).toMatchObject({ name: 'ABD', flag: 'us', group: 'A' });
    expect(byId.BRA).toMatchObject({ id: 'BRA', name: 'Brazil', flag: '', group: '?' });
  });
});
