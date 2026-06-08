const ROUNDS = [
  { stage: 'r32', label: 'Son 32' },
  { stage: 'r16', label: 'Son 16' },
  { stage: 'qf', label: 'Çeyrek Final' },
  { stage: 'sf', label: 'Yarı Final' },
  { stage: 'final', label: 'Final' },
];

export function getBracketRounds(matches) {
  return ROUNDS.map(({ stage, label }) => ({
    stage,
    label,
    matches: matches
      .filter((m) => m.stage === stage)
      .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC)),
  }));
}
