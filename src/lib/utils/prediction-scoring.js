export function scoreMatch(pred, match) {
  if (!pred || match.status !== 'finished') return 0;
  const ph = pred.home, pa = pred.away, rh = match.homeScore, ra = match.awayScore;
  if ([ph, pa, rh, ra].some((n) => typeof n !== 'number')) return 0;
  if (ph === rh && pa === ra) return 5;
  if (ph - pa === rh - ra) return 3;
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return 2;
  return 0;
}

export function computePredictionScore(predictions, matches) {
  const byId = new Map(matches.map((m) => [String(m.id), m]));
  const ms = predictions.matchScores ?? {};

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

  const bracketPoints = scoreBracketTree(predictions.bracket, matches);
  const championPoints = scoreChampion(predictions.champion, matches);

  return { matchPoints, bracketPoints, championPoints, total: matchPoints + bracketPoints + championPoints, scoredCount, correctCount, exactCount, best };
}

export const TIER_WEIGHTS = { r16: 1, qf: 2, sf: 4, final: 6 };

export function reachedRound(matches) {
  const sets = { r16: new Set(), qf: new Set(), sf: new Set(), final: new Set() };
  let champion = null;
  for (const m of matches) {
    if (sets[m.stage]) {
      if (m.homeId) sets[m.stage].add(m.homeId);
      if (m.awayId) sets[m.stage].add(m.awayId);
    }
    if (m.stage === 'final' && m.status === 'finished' && m.winner) champion = m.winner;
  }
  return { ...sets, champion };
}

export function scoreBracketTree(bracket, matches) {
  const reached = reachedRound(matches);
  let pts = 0;
  for (const tier of ['r16', 'qf', 'sf', 'final']) {
    for (const id of bracket?.[tier] ?? []) {
      if (reached[tier].has(id)) pts += TIER_WEIGHTS[tier];
    }
  }
  return pts;
}

export function scoreChampion(champion, matches) {
  const c = reachedRound(matches).champion;
  return champion && c && champion === c ? 10 : 0;
}

export function isLocked(matches, nowMs = Date.now()) {
  const first = [...matches].sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))[0];
  return first ? nowMs >= Date.parse(first.datetimeUTC) : false;
}
