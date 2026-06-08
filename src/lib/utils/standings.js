export function computeStandings(matches, teams) {
  const groups = new Map();
  for (const t of teams) {
    if (!t.group || t.group === '?') continue;
    if (!groups.has(t.group)) groups.set(t.group, new Map());
    groups.get(t.group).set(t.id, {
      teamId: t.id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0,
    });
  }

  for (const m of matches) {
    if (m.stage !== 'group' || m.status !== 'finished') continue;
    if (typeof m.homeScore !== 'number' || typeof m.awayScore !== 'number') continue;
    const g = groups.get(m.group);
    if (!g) continue;
    const home = g.get(m.homeId);
    const away = g.get(m.awayId);
    if (!home || !away) continue;

    home.P++; away.P++;
    home.GF += m.homeScore; home.GA += m.awayScore;
    away.GF += m.awayScore; away.GA += m.homeScore;
    if (m.homeScore > m.awayScore) { home.W++; home.Pts += 3; away.L++; }
    else if (m.homeScore < m.awayScore) { away.W++; away.Pts += 3; home.L++; }
    else { home.D++; away.D++; home.Pts++; away.Pts++; }
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([group, rowsMap]) => {
      const rows = [...rowsMap.values()];
      for (const r of rows) r.GD = r.GF - r.GA;
      rows.sort((x, y) =>
        y.Pts - x.Pts || y.GD - x.GD || y.GF - x.GF ||
        (x.teamId < y.teamId ? -1 : 1));
      return { group, rows };
    });
}
