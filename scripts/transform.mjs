const STAGE_MAP = {
  GROUP_STAGE: 'group',
  LAST_32: 'r32',
  LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'third',
  FINAL: 'final',
};

export function mapStage(apiStage) {
  return STAGE_MAP[apiStage] ?? 'group';
}

export function mapGroup(apiGroup) {
  if (!apiGroup) return null;
  const m = /^GROUP_([A-L])$/.exec(apiGroup);
  return m ? m[1] : null;
}

export function mapStatus(apiStatus) {
  if (apiStatus === 'FINISHED' || apiStatus === 'AWARDED') return 'finished';
  if (apiStatus === 'IN_PLAY' || apiStatus === 'PAUSED') return 'live';
  return 'scheduled';
}

function registerTeam(map, t, group, teamMeta) {
  const id = t?.tla || String(t?.id ?? '');
  if (!id) return;
  const existing = map.get(id);
  if (existing) {
    if (group && (!existing.group || existing.group === '?')) existing.group = group;
    return;
  }
  const meta = teamMeta[id] ?? {};
  map.set(id, {
    id,
    name: meta.tr ?? t?.name ?? id,
    code: id,
    group: group ?? '?',
    flag: meta.flag ?? '',
  });
}

export function transformMatches(apiMatches, teamMeta = {}) {
  const teamsMap = new Map();
  const matches = apiMatches.map((m) => {
    const group = mapGroup(m.group);
    const home = m.homeTeam ?? {};
    const away = m.awayTeam ?? {};
    registerTeam(teamsMap, home, group, teamMeta);
    registerTeam(teamsMap, away, group, teamMeta);
    return {
      id: String(m.id),
      stage: mapStage(m.stage),
      group,
      homeId: home.tla || String(home.id ?? ''),
      awayId: away.tla || String(away.id ?? ''),
      datetimeUTC: m.utcDate,
      venue: m.venue ?? '',
      city: '',
      status: mapStatus(m.status),
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      winner: m.score?.winner === 'HOME_TEAM' ? (home.tla || String(home.id ?? ''))
        : m.score?.winner === 'AWAY_TEAM' ? (away.tla || String(away.id ?? ''))
        : null,
      scorers: [],
    };
  });
  return { teams: [...teamsMap.values()], matches };
}
