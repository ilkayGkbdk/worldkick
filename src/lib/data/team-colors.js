// teamId (TLA) → accent-friendly primary color. Tones kept medium/dark so white
// button text stays readable. Unknown ids fall back to the default accent.
const COLORS = {
  CAN: '#D52B1E', MEX: '#1B7A43', USA: '#1C3F94', ARG: '#3F7FBF', BRA: '#1E9E4A',
  URU: '#3E82C4', COL: '#B98900', ECU: '#B98900', PAR: '#C8102E', PER: '#D7142B',
  CHI: '#1565C0', FRA: '#1C3F94', ENG: '#C8102E', SCO: '#1565C0', WAL: '#C8102E',
  ESP: '#C8102E', GER: '#2A2A2A', POR: '#C8102E', NED: '#E1670F', BEL: '#C8102E',
  ITA: '#1E5AA8', CRO: '#C8102E', SUI: '#D52B1E', DEN: '#C8102E', POL: '#C8102E',
  SRB: '#C8102E', AUT: '#C8102E', TUR: '#E30A17', UKR: '#1565C0', CZE: '#1565C0',
  NOR: '#C8102E', SWE: '#0A5BA8', JPN: '#1C2D6B', KOR: '#C8102E', AUS: '#0B7A3B',
  IRN: '#1E9E4A', KSA: '#1B7A43', QAT: '#6A1B3A', UZB: '#1565C0', JOR: '#C8102E',
  MAR: '#B81D2C', SEN: '#1E9E4A', TUN: '#C8102E', ALG: '#1E7A43', EGY: '#C8102E',
  NGA: '#1E9E4A', GHA: '#1E7A43', CMR: '#1E7A43', CIV: '#E1670F', RSA: '#1E7A43',
  CRC: '#C8102E', PAN: '#C8102E', JAM: '#0B7A3B', HON: '#1565C0', NZL: '#2A2A2A',
};

export const DEFAULT_ACCENT = '#ff2e63';

export function teamColor(teamId) {
  return COLORS[teamId] ?? null;
}
