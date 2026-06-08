export function scoreMatch(pred, match) {
  if (!pred || match.status !== 'finished') return 0;
  const ph = pred.home, pa = pred.away, rh = match.homeScore, ra = match.awayScore;
  if ([ph, pa, rh, ra].some((n) => typeof n !== 'number')) return 0;
  if (ph === rh && pa === ra) return 5;
  if (ph - pa === rh - ra) return 3;
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return 2;
  return 0;
}
