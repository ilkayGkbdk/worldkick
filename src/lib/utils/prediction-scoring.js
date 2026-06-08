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
