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
