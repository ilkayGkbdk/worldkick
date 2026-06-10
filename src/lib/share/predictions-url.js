import LZString from 'lz-string';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString;

export function encodePredictions(p) {
  const compact = { s: p.matchScores ?? {}, b: p.bracket ?? {}, c: p.champion ?? null };
  return compressToEncodedURIComponent(JSON.stringify(compact));
}

export function decodePredictions(str) {
  try {
    const json = decompressFromEncodedURIComponent(str);
    if (!json) return null;
    const o = JSON.parse(json);
    if (!o || typeof o !== 'object') return null;
    return {
      matchScores: o.s ?? {},
      bracket: { r16: [], qf: [], sf: [], final: [], ...(o.b ?? {}) },
      champion: o.c ?? null,
    };
  } catch {
    return null;
  }
}
