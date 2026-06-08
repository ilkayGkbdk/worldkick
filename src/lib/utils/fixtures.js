import { isSameLocalDay } from './datetime.js';

export function getNextMatch(matches, nowMs = Date.now()) {
  const upcoming = matches
    .filter((m) => Date.parse(m.datetimeUTC) > nowMs)
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));
  return upcoming[0] ?? null;
}

export function getMatchesOn(matches, ref = new Date(), timeZone = undefined) {
  return matches
    .filter((m) => isSameLocalDay(m.datetimeUTC, ref, timeZone))
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));
}

export function getMatchdays(matches, timeZone = undefined) {
  const byDay = new Map();
  for (const m of matches) {
    const key = new Date(m.datetimeUTC).toLocaleDateString('en-CA', { timeZone });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([key, ms]) => ({
      key,
      matches: ms.sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC)),
    }));
}

export function filterByGroup(matches, group) {
  if (!group) return matches;
  return matches.filter((m) => m.group === group);
}

export function getTeamMatches(matches, teamId) {
  return matches
    .filter((m) => m.homeId === teamId || m.awayId === teamId)
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));
}
