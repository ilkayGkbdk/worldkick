// Favori takımların yeni biten galibiyetlerinden henüz kutlanmamış olanları döner.
export function pendingCelebrations(matches, favoriteIds, celebratedIds = []) {
  const favs = new Set(favoriteIds);
  const seen = new Set(celebratedIds.map(String));
  return matches
    .filter((m) => m.status === 'finished' && m.winner && favs.has(m.winner) && !seen.has(String(m.id)))
    .map((m) => String(m.id));
}
