export function scoreMatch(pred, match) {
  if (!pred || match.status !== 'finished') return 0;
  const ph = pred.home, pa = pred.away, rh = match.homeScore, ra = match.awayScore;
  if ([ph, pa, rh, ra].some((n) => typeof n !== 'number')) return 0;
  if (ph === rh && pa === ra) return 5;
  if (ph - pa === rh - ra) return 3;
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return 2;
  return 0;
}

export const BRACKET_WEIGHTS = { r32: 1, r16: 2, qf: 4, sf: 6, final: 8 };

export function scoreBracket(pickTeamId, match) {
  if (!pickTeamId || match.status !== 'finished' || !match.winner) return 0;
  if (pickTeamId !== match.winner) return 0;
  return BRACKET_WEIGHTS[match.stage] ?? 0;
}

export function championOf(matches) {
  const final = matches.find((m) => m.stage === 'final' && m.status === 'finished' && m.winner);
  return final ? final.winner : null;
}

export function computePredictionScore(predictions, matches) {
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  const ms = predictions.matchScores ?? {};
  const bp = predictions.bracketPicks ?? {};

  let matchPoints = 0, scoredCount = 0, correctCount = 0, exactCount = 0, best = null;
  for (const [id, pred] of Object.entries(ms)) {
    const match = byId.get(String(id));
    if (!match || match.status !== 'finished') continue;
    const pts = scoreMatch(pred, match);
    matchPoints += pts;
    scoredCount += 1;
    if (pts > 0) correctCount += 1;
    if (pts === 5) exactCount += 1;
    if (!best || pts > best.points) best = { matchId: String(id), points: pts };
  }

  let bracketPoints = 0;
  for (const [id, teamId] of Object.entries(bp)) {
    const match = byId.get(String(id));
    if (match) bracketPoints += scoreBracket(teamId, match);
  }

  const champ = championOf(matches);
  const championPoints = predictions.champion && champ && predictions.champion === champ ? 10 : 0;

  return { matchPoints, bracketPoints, championPoints, total: matchPoints + bracketPoints + championPoints, scoredCount, correctCount, exactCount, best };
}

const KNOCKOUT = new Set(['r32', 'r16', 'qf', 'sf', 'final']);

export function isMatchPredictable(match, nowMs = Date.now()) {
  return Date.parse(match.datetimeUTC) > nowMs;
}

export function isBracketPredictable(match, teams, nowMs = Date.now()) {
  if (!KNOCKOUT.has(match.stage)) return false;
  const known = (id) => teams.some((t) => t.id === id);
  return known(match.homeId) && known(match.awayId) && Date.parse(match.datetimeUTC) > nowMs;
}

export function isChampionLocked(matches, nowMs = Date.now()) {
  const first = matches
    .filter((m) => m.stage === 'r32')
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))[0];
  return first ? nowMs >= Date.parse(first.datetimeUTC) : false;
}
