export const ORDER = ['r16', 'qf', 'sf', 'final'];
export const CAP = { r16: 16, qf: 8, sf: 4, final: 2 };

export function toggleTier(bracket, tier, teamId) {
  const b = {
    r16: [...(bracket.r16 ?? [])],
    qf: [...(bracket.qf ?? [])],
    sf: [...(bracket.sf ?? [])],
    final: [...(bracket.final ?? [])],
  };
  const idx = ORDER.indexOf(tier);
  if (idx === -1) return b;

  if (b[tier].includes(teamId)) {
    for (let i = idx; i < ORDER.length; i++) {
      b[ORDER[i]] = b[ORDER[i]].filter((x) => x !== teamId);
    }
    return b;
  }
  if (idx > 0 && !b[ORDER[idx - 1]].includes(teamId)) return b;
  if (b[tier].length >= CAP[tier]) return b;
  b[tier] = [...b[tier], teamId];
  return b;
}
