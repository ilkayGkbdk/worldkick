# Tahmin Oyunu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WorldKick'e maç skoru + eleme + şampiyon tahmini, gerçek sonuçlardan client-side puanlama, "Tahmin" sekmesi/hub ve paylaşılabilir puan kartı ekleyen tahmin oyununu kurmak.

**Architecture:** Tahminler `localStorage`'da (`predictions` store). Puanlama saf fonksiyonlarla (`prediction-scoring.js`, TDD) mevcut `matches.json` sonuçlarından türetilir; saklanmaz. Yeni 5. sekme adanmış hub'ı barındırır; bileşenler `src/components/` altında. Backend yok.

**Tech Stack:** Svelte 5 (legacy `$:`/`$store`), svelte-spa-router v5, Vitest, Canvas 2D (paylaşım kartı).

**Mevcut kod tabanı (DEĞİŞTİRME, kullan):**
- `src/lib/stores/data.js` → `matches`, `teams` store'ları, `teamById(list,id)`, `matchById(list,id)`.
- `src/lib/utils/tournament.js` → `getBracketRounds(matches)` → `[{stage,label,matches}]`.
- `src/lib/utils/datetime.js` → `formatLocalDate`, `formatLocalTime`.
- `src/components/Flag.svelte` (props `code`,`size`), `Icon.svelte` (prop `name`,`size`; iç `paths` haritası), `TabBar.svelte` (`tabs` dizisi + `Icon`), `MatchRow.svelte`.
- `src/App.svelte` → `routes` objesi `{'/':Home,'/fixtures':Fixtures,'/tournament':Tournament,'/favorites':Favorites,'/match/:id':MatchDetail,'/team/:id':TeamDetail}`.
- Maç şeması: `{ id, stage, group, homeId, awayId, datetimeUTC, venue, city, status, homeScore, awayScore, scorers }`. Bu plan şemaya `winner` ekler (Task 1).
- Test: `npm test -- <ad>`; Build: `npm run build`.

---

## Faz 1 — Veri + Puanlama + Store + Sekme

### Task 1: Transform'a `winner` alanı (TDD)

**Files:** Modify: `scripts/transform.mjs`, `scripts/transform.test.mjs`

> football-data `score.winner` (`HOME_TEAM`/`AWAY_TEAM`/`DRAW`) ile kazanan takım id'si türetilir. Eleme penaltı sonucu için skor yetmez; `winner` gerekir.

- [ ] **Step 1: Teste winner beklentisi ekle**

`scripts/transform.test.mjs` içinde `api` dizisindeki **id:100** maçına `"winner"` eklemek için o nesneye `score` satırını şu şekilde değiştir (sadece score satırı):
```js
      score: { winner: 'HOME_TEAM', fullTime: { home: 2, away: 1 } },
```
ve `transformMatches maçları iç şemaya çevirir` testindeki `matches[0]` `toMatchObject` çağrısına `winner: 'MEX'` ekle (mevcut alanların yanına). Ayrıca `matches[1]` (TIMED) için yeni bir satır ekle:
```js
    expect(matches[1].winner).toBeNull();
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- transform`
Expected: FAIL — `winner` undefined.

- [ ] **Step 3: transform.mjs'e winner ekle**

`scripts/transform.mjs` içinde `transformMatches`'in `return { ... }` nesnesine, `scorers: []` satırından ÖNCE ekle:
```js
      winner: m.score?.winner === 'HOME_TEAM' ? (home.tla || String(home.id ?? ''))
        : m.score?.winner === 'AWAY_TEAM' ? (away.tla || String(away.id ?? ''))
        : null,
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- transform`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/transform.mjs scripts/transform.test.mjs
git commit -m "feat: add winner field to match transform"
```
COMMIT KURALI: Conventional Commits, ASLA Co-Authored-By, --author yok.

---

### Task 2: Maç skoru puanlaması (TDD)

**Files:** Create: `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/utils/prediction-scoring.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { scoreMatch } from './prediction-scoring.js';

const fin = (h, a) => ({ status: 'finished', homeScore: h, awayScore: a });

describe('scoreMatch', () => {
  it('tam skor = 5', () => expect(scoreMatch({ home: 2, away: 1 }, fin(2, 1))).toBe(5));
  it('doğru averaj (tam değil) = 3', () => expect(scoreMatch({ home: 2, away: 1 }, fin(3, 2))).toBe(3));
  it('doğru beraberlik averajı = 3', () => expect(scoreMatch({ home: 1, away: 1 }, fin(2, 2))).toBe(3));
  it('doğru sonuç (averaj farklı) = 2', () => expect(scoreMatch({ home: 3, away: 1 }, fin(1, 0))).toBe(2));
  it('yanlış = 0', () => expect(scoreMatch({ home: 0, away: 2 }, fin(1, 0))).toBe(0));
  it('bitmemiş maç = 0', () => expect(scoreMatch({ home: 1, away: 0 }, { status: 'scheduled', homeScore: null, awayScore: null })).toBe(0));
  it('tahmin yok = 0', () => expect(scoreMatch(null, fin(1, 0))).toBe(0));
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- prediction-scoring`
Expected: FAIL.

- [ ] **Step 3: Implementasyon**

`src/lib/utils/prediction-scoring.js`:
```js
export function scoreMatch(pred, match) {
  if (!pred || match.status !== 'finished') return 0;
  const ph = pred.home, pa = pred.away, rh = match.homeScore, ra = match.awayScore;
  if ([ph, pa, rh, ra].some((n) => typeof n !== 'number')) return 0;
  if (ph === rh && pa === ra) return 5;
  if (ph - pa === rh - ra) return 3;
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return 2;
  return 0;
}
```

- [ ] **Step 4: Geçtiğini doğrula**

Run: `npm test -- prediction-scoring`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/prediction-scoring.js src/lib/utils/prediction-scoring.test.js
git commit -m "feat: add match score prediction scoring"
```

---

### Task 3: Bracket + şampiyon puanlaması (TDD)

**Files:** Modify: `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js`

- [ ] **Step 1: Testleri ekle (dosya SONUNA)**

`src/lib/utils/prediction-scoring.test.js` sonuna:
```js
import { BRACKET_WEIGHTS, scoreBracket, championOf } from './prediction-scoring.js';

const ko = (stage, winner) => ({ stage, status: 'finished', winner });

describe('scoreBracket', () => {
  it('doğru kazanan, tur ağırlığı kadar puan', () => {
    expect(scoreBracket('BRA', ko('qf', 'BRA'))).toBe(BRACKET_WEIGHTS.qf);
    expect(scoreBracket('BRA', ko('final', 'BRA'))).toBe(8);
  });
  it('yanlış kazanan = 0', () => expect(scoreBracket('ARG', ko('qf', 'BRA'))).toBe(0));
  it('bitmemiş / kazanansız = 0', () => {
    expect(scoreBracket('BRA', { stage: 'qf', status: 'scheduled', winner: null })).toBe(0);
  });
});

describe('championOf', () => {
  it('bitmiş finalin kazananını döner', () => {
    const matches = [ko('sf', 'BRA'), { id: 1, stage: 'final', status: 'finished', winner: 'BRA' }];
    expect(championOf(matches)).toBe('BRA');
  });
  it('final bitmemişse null', () => {
    expect(championOf([{ stage: 'final', status: 'scheduled', winner: null }])).toBeNull();
  });
});
```

- [ ] **Step 2: Başarısız doğrula**

Run: `npm test -- prediction-scoring`
Expected: FAIL.

- [ ] **Step 3: Implementasyon (dosya SONUNA ekle)**

`src/lib/utils/prediction-scoring.js` sonuna:
```js
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
```

- [ ] **Step 4: Geçtiğini doğrula**

Run: `npm test -- prediction-scoring`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/prediction-scoring.js src/lib/utils/prediction-scoring.test.js
git commit -m "feat: add bracket and champion scoring"
```

---

### Task 4: Karne toplamı (TDD)

**Files:** Modify: `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js`

- [ ] **Step 1: Test ekle (SONA)**

```js
import { computePredictionScore } from './prediction-scoring.js';

describe('computePredictionScore', () => {
  const matches = [
    { id: 'm1', stage: 'group', status: 'finished', homeScore: 2, awayScore: 1, winner: 'A' },
    { id: 'm2', stage: 'group', status: 'scheduled', homeScore: null, awayScore: null, winner: null },
    { id: 'k1', stage: 'qf', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A' },
    { id: 'f1', stage: 'final', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A' },
  ];
  const predictions = {
    matchScores: { m1: { home: 2, away: 1 }, m2: { home: 1, away: 1 } },
    bracketPicks: { k1: 'A' },
    champion: 'A',
  };

  it('maç, bracket ve şampiyon puanlarını toplar', () => {
    const s = computePredictionScore(predictions, matches);
    expect(s.matchPoints).toBe(5);      // m1 tam skor; m2 bitmemiş = 0
    expect(s.bracketPoints).toBe(4);    // k1 qf doğru
    expect(s.championPoints).toBe(10);  // f1 kazananı A
    expect(s.total).toBe(19);
    expect(s.scoredCount).toBe(1);
    expect(s.correctCount).toBe(1);
    expect(s.exactCount).toBe(1);
    expect(s.best).toEqual({ matchId: 'm1', points: 5 });
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — Run: `npm test -- prediction-scoring` → FAIL.

- [ ] **Step 3: Implementasyon (SONA)**

```js
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
```

- [ ] **Step 4: Geçtiğini doğrula** — Run: `npm test -- prediction-scoring` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/utils/prediction-scoring.js src/lib/utils/prediction-scoring.test.js
git commit -m "feat: add prediction scorecard aggregation"
```

---

### Task 5: Kilit/uygunluk yardımcıları (TDD)

**Files:** Modify: `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js`

- [ ] **Step 1: Test ekle (SONA)**

```js
import { isMatchPredictable, isBracketPredictable, isChampionLocked } from './prediction-scoring.js';

describe('uygunluk', () => {
  const now = Date.parse('2026-06-11T12:00:00Z');
  const future = { datetimeUTC: '2026-06-11T20:00:00Z' };
  const past = { datetimeUTC: '2026-06-11T09:00:00Z' };
  const teams = [{ id: 'A' }, { id: 'B' }];

  it('isMatchPredictable: başlamadıysa true', () => {
    expect(isMatchPredictable(future, now)).toBe(true);
    expect(isMatchPredictable(past, now)).toBe(false);
  });
  it('isBracketPredictable: eleme + iki takım bilinir + başlamamış', () => {
    expect(isBracketPredictable({ stage: 'r16', homeId: 'A', awayId: 'B', datetimeUTC: future.datetimeUTC }, teams, now)).toBe(true);
    expect(isBracketPredictable({ stage: 'r16', homeId: 'A', awayId: 'Z', datetimeUTC: future.datetimeUTC }, teams, now)).toBe(false);
    expect(isBracketPredictable({ stage: 'group', homeId: 'A', awayId: 'B', datetimeUTC: future.datetimeUTC }, teams, now)).toBe(false);
  });
  it('isChampionLocked: ilk r32 başladıysa true', () => {
    const matches = [{ stage: 'r32', datetimeUTC: '2026-06-28T18:00:00Z' }];
    expect(isChampionLocked(matches, Date.parse('2026-06-28T19:00:00Z'))).toBe(true);
    expect(isChampionLocked(matches, Date.parse('2026-06-28T17:00:00Z'))).toBe(false);
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — `npm test -- prediction-scoring` → FAIL.

- [ ] **Step 3: Implementasyon (SONA)**

```js
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
```

- [ ] **Step 4: Geçtiğini doğrula** — `npm test -- prediction-scoring` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/utils/prediction-scoring.js src/lib/utils/prediction-scoring.test.js
git commit -m "feat: add prediction lock/eligibility helpers"
```

---

### Task 6: predictions store

**Files:** Create: `src/lib/stores/predictions.js`

- [ ] **Step 1: Store'u yaz**

`src/lib/stores/predictions.js`:
```js
import { writable } from 'svelte/store';

const KEY = 'wk-predictions';
const EMPTY = { matchScores: {}, bracketPicks: {}, champion: null };

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v === 'object') return { ...EMPTY, ...v };
  } catch {}
  return { ...EMPTY };
}

function createPredictions() {
  const { subscribe, update } = writable(load());
  const persist = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  return {
    subscribe,
    setMatchScore(id, home, away) {
      update((s) => { const n = { ...s, matchScores: { ...s.matchScores, [id]: { home, away } } }; persist(n); return n; });
    },
    clearMatchScore(id) {
      update((s) => { const ms = { ...s.matchScores }; delete ms[id]; const n = { ...s, matchScores: ms }; persist(n); return n; });
    },
    setBracketPick(id, teamId) {
      update((s) => { const n = { ...s, bracketPicks: { ...s.bracketPicks, [id]: teamId } }; persist(n); return n; });
    },
    setChampion(teamId) {
      update((s) => { const n = { ...s, champion: teamId }; persist(n); return n; });
    },
  };
}

export const predictions = createPredictions();
```

- [ ] **Step 2: Build** — `npm run build` → hatasız; `npm test` → hepsi geçer.

- [ ] **Step 3: Commit**
```bash
git add src/lib/stores/predictions.js
git commit -m "feat: add predictions store"
```

---

### Task 7: "Tahmin" sekmesi + route + hub iskeleti

**Files:** Modify: `src/components/Icon.svelte`, `src/components/TabBar.svelte`, `src/App.svelte`. Create: `src/routes/Predictions.svelte`

- [ ] **Step 1: Icon'a target ekle**

`src/components/Icon.svelte` içindeki `paths` nesnesine, `star:` satırından ÖNCE ekle:
```js
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
```

- [ ] **Step 2: TabBar'a sekme ekle**

`src/components/TabBar.svelte` içindeki `tabs` dizisinde, `{ path: '/favorites', ... }` satırından ÖNCE ekle:
```js
    { path: '/predictions', icon: 'target', label: 'Tahmin' },
```

- [ ] **Step 3: App route**

`src/App.svelte` import bloğuna ekle:
```js
  import Predictions from './routes/Predictions.svelte';
```
`routes` objesine `'/team/:id': TeamDetail,` satırının ALTINA ekle:
```js
    '/predictions': Predictions,
```

- [ ] **Step 4: Minimal hub**

`src/routes/Predictions.svelte`:
```svelte
<script>
  import { matches } from '../lib/stores/data.js';
  import { predictions } from '../lib/stores/predictions.js';
  import { computePredictionScore } from '../lib/utils/prediction-scoring.js';
  $: score = computePredictionScore($predictions, $matches);
</script>

<div class="page">
  <h2>Tahminlerin</h2>
  <p class="total">{score.total} <span>puan</span></p>
  <p class="soon">Tahmin girişi yakında.</p>
</div>

<style>
  .page { padding: 16px; }
  .total { font-family: var(--font-head); font-weight: 800; font-size: 40px; }
  .total span { font-size: 16px; color: var(--muted); }
  .soon { color: var(--muted); }
</style>
```

- [ ] **Step 5: Build + dev**

Run: `npm run build` → hatasız. Run: `npm test` → geçer. `npm run dev`, `#/predictions` açılınca 5. sekme "Tahmin" ve 0 puan görünmeli.

- [ ] **Step 6: Commit**
```bash
git add src/components/Icon.svelte src/components/TabBar.svelte src/App.svelte src/routes/Predictions.svelte
git commit -m "feat: add prediction tab, route and hub skeleton"
```

---

## Faz 2 — Maç tahmini + karne

### Task 8: PredictMatch bileşeni

**Files:** Create: `src/components/PredictMatch.svelte`

- [ ] **Step 1: Bileşeni yaz**

`src/components/PredictMatch.svelte`:
```svelte
<script>
  import { predictions } from '../lib/stores/predictions.js';
  import { isMatchPredictable, scoreMatch } from '../lib/utils/prediction-scoring.js';
  import { formatLocalDate, formatLocalTime } from '../lib/utils/datetime.js';
  import Flag from './Flag.svelte';

  export let match;
  export let home;
  export let away;

  $: pred = $predictions.matchScores[match.id] ?? null;
  $: editable = isMatchPredictable(match);
  $: finished = match.status === 'finished';
  $: pts = finished && pred ? scoreMatch(pred, match) : null;
  $: h = pred?.home ?? 0;
  $: a = pred?.away ?? 0;

  function bump(side, delta) {
    if (!editable) return;
    const nh = side === 'h' ? Math.max(0, h + delta) : h;
    const na = side === 'a' ? Math.max(0, a + delta) : a;
    predictions.setMatchScore(match.id, nh, na);
  }
</script>

<div class="pm" class:locked={!editable}>
  <div class="row">
    <span class="team"><Flag code={home?.flag} size={22} /> {home?.code ?? match.homeId}</span>
    {#if editable}
      <div class="step"><button on:click={() => bump('h', -1)} aria-label="azalt">–</button><span class="v">{h}</span><button on:click={() => bump('h', 1)} aria-label="artır">+</button></div>
    {:else}
      <span class="v">{pred ? pred.home : '–'}</span>
    {/if}
  </div>
  <div class="row">
    <span class="team"><Flag code={away?.flag} size={22} /> {away?.code ?? match.awayId}</span>
    {#if editable}
      <div class="step"><button on:click={() => bump('a', -1)} aria-label="azalt">–</button><span class="v">{a}</span><button on:click={() => bump('a', 1)} aria-label="artır">+</button></div>
    {:else}
      <span class="v">{pred ? pred.away : '–'}</span>
    {/if}
  </div>
  <div class="foot">
    {#if editable}
      <span class="hint">{formatLocalDate(match.datetimeUTC)} {formatLocalTime(match.datetimeUTC)}'a kadar</span>
    {:else if finished && pred}
      <span class="res">Sonuç {match.homeScore}-{match.awayScore} · <b class:win={pts > 0}>+{pts} puan</b></span>
    {:else if finished}
      <span class="res">Sonuç {match.homeScore}-{match.awayScore} · tahmin yok</span>
    {:else}
      <span class="hint">kilitli</span>
    {/if}
  </div>
</div>

<style>
  .pm { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 12px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 8px; }
  .pm.locked { opacity: .85; }
  .row { display: flex; align-items: center; justify-content: space-between; }
  .team { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; }
  .step { display: flex; align-items: center; gap: 8px; }
  .step button { width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 15px; font-weight: 800; cursor: pointer; }
  .v { font-family: var(--font-head); font-weight: 800; font-size: 18px; min-width: 18px; text-align: center; }
  .foot { border-top: 1px solid var(--border); padding-top: 8px; font-size: 11px; color: var(--muted); }
  .res b { color: var(--muted); }
  .res b.win { color: var(--accent); }
</style>
```

- [ ] **Step 2: Build** — `npm run build` → hatasız.

- [ ] **Step 3: Commit**
```bash
git add src/components/PredictMatch.svelte
git commit -m "feat: add match prediction stepper component"
```

---

### Task 9: PredictionScorecard bileşeni

**Files:** Create: `src/components/PredictionScorecard.svelte`

- [ ] **Step 1: Bileşeni yaz**

`src/components/PredictionScorecard.svelte`:
```svelte
<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  export let score;
  export let championTeam = null;
  const t = tweened(0, { duration: 800, easing: cubicOut });
  $: t.set(score.total);
  $: acc = score.scoredCount ? Math.round((score.correctCount / score.scoredCount) * 100) : 0;
</script>

<div class="card">
  <span class="lab">Tahmin karnen</span>
  <div class="pts">{Math.round($t)} <span>puan</span></div>
  <div class="meta">{score.correctCount}/{score.scoredCount} isabet · %{acc} · {score.exactCount} tam skor</div>
  {#if championTeam}
    <div class="champ">Şampiyon tahminin: <b>{championTeam.name}</b></div>
  {/if}
</div>

<style>
  .card {
    border-radius: 18px; padding: 18px; box-shadow: var(--shadow);
    border: 1px solid var(--border);
    background: radial-gradient(120% 100% at 100% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%), var(--surface);
  }
  .lab { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; color: var(--accent); }
  .pts { font-family: var(--font-head); font-weight: 800; font-size: 36px; line-height: 1; margin: 6px 0 4px; font-variant-numeric: tabular-nums; }
  .pts span { font-size: 15px; color: var(--muted); }
  .meta { font-size: 12px; color: var(--muted); }
  .champ { margin-top: 12px; border-top: 1px solid var(--border); padding-top: 10px; font-size: 12px; color: var(--muted); }
  .champ b { color: var(--text); }
</style>
```

- [ ] **Step 2: Build** — `npm run build` → hatasız.

- [ ] **Step 3: Commit**
```bash
git add src/components/PredictionScorecard.svelte
git commit -m "feat: add prediction scorecard component"
```

---

### Task 10: Hub — karne + tahmin edilebilir maçlar

**Files:** Modify: `src/routes/Predictions.svelte` (tamamen değiştir)

- [ ] **Step 1: Hub'ı yaz**

`src/routes/Predictions.svelte` içeriğini TAMAMEN değiştir:
```svelte
<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { predictions } from '../lib/stores/predictions.js';
  import { computePredictionScore, isMatchPredictable } from '../lib/utils/prediction-scoring.js';
  import PredictionScorecard from '../components/PredictionScorecard.svelte';
  import PredictMatch from '../components/PredictMatch.svelte';

  $: score = computePredictionScore($predictions, $matches);
  $: championTeam = $predictions.champion ? teamById($teams, $predictions.champion) : null;

  $: open = [...$matches]
    .filter((m) => isMatchPredictable(m))
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))
    .slice(0, 8);

  $: scored = [...$matches]
    .filter((m) => m.status === 'finished' && $predictions.matchScores[m.id])
    .sort((a, b) => Date.parse(b.datetimeUTC) - Date.parse(a.datetimeUTC))
    .slice(0, 6);
</script>

<div class="page">
  <h2>Tahminlerin</h2>

  <PredictionScorecard {score} {championTeam} />

  {#if open.length}
    <section>
      <h3 class="sec">Sıradaki tahminler</h3>
      <div class="list">
        {#each open as m (m.id)}
          <PredictMatch match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
        {/each}
      </div>
    </section>
  {/if}

  {#if scored.length}
    <section>
      <h3 class="sec">Sonuçlanan tahminler</h3>
      <div class="list">
        {#each scored as m (m.id)}
          <PredictMatch match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
        {/each}
      </div>
    </section>
  {/if}

  {#if open.length === 0 && scored.length === 0}
    <p class="empty">Tahmin edilecek maç yok.</p>
  {/if}
</div>

<style>
  .page { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 0 0 10px; }
  .list { display: flex; flex-direction: column; gap: 10px; }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 2: Build + dev** — `npm run build` → hatasız; `npm test` → geçer. `npm run dev`: `#/predictions`'da karne + stepper'lı maçlar; skor girip artırınca anında kaydolmalı; sayfa yenilense de kalmalı (localStorage).

- [ ] **Step 3: Commit**
```bash
git add src/routes/Predictions.svelte
git commit -m "feat: wire prediction hub with scorecard and match predictions"
```

---

## Faz 3 — Şampiyon

### Task 11: ChampionPicker bileşeni

**Files:** Create: `src/components/ChampionPicker.svelte`

- [ ] **Step 1: Bileşeni yaz**

`src/components/ChampionPicker.svelte`:
```svelte
<script>
  import { predictions } from '../lib/stores/predictions.js';
  import Flag from './Flag.svelte';
  export let teams = [];
  export let locked = false;
  $: champ = $predictions.champion;
</script>

<div class="grid">
  {#each teams as t (t.id)}
    <button class="cell" class:on={champ === t.id} disabled={locked}
      on:click={() => predictions.setChampion(t.id)} aria-label={t.name}>
      <Flag code={t.flag} size={30} />
      <span>{t.code}</span>
    </button>
  {/each}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; }
  .cell {
    display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    cursor: pointer; color: var(--text); font-weight: 700; font-size: 11px;
  }
  .cell.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .cell:disabled { opacity: .55; cursor: default; }
</style>
```

- [ ] **Step 2: Build** — `npm run build` → hatasız.

- [ ] **Step 3: Commit**
```bash
git add src/components/ChampionPicker.svelte
git commit -m "feat: add champion picker component"
```

---

### Task 12: Hub — şampiyon bölümü

**Files:** Modify: `src/routes/Predictions.svelte`

- [ ] **Step 1: Import + state ekle**

`src/routes/Predictions.svelte` `<script>` içine, importlara ekle:
```js
  import ChampionPicker from '../components/ChampionPicker.svelte';
  import { isChampionLocked } from '../lib/utils/prediction-scoring.js';
```
Reaktif satırların yanına ekle:
```js
  $: champLocked = isChampionLocked($matches);
  $: realTeams = $teams.filter((t) => t.group && t.group !== '?');
```

- [ ] **Step 2: Şampiyon bölümünü ekle**

`PredictionScorecard` satırının hemen ALTINA ekle:
```svelte
  {#if realTeams.length}
    <section>
      <h3 class="sec">Şampiyon tahminin {#if champLocked}<span class="lock">· kilitli</span>{/if}</h3>
      <ChampionPicker teams={realTeams} locked={champLocked} />
    </section>
  {/if}
```
Ve `<style>` içine ekle:
```css
  .lock { color: var(--muted); font-weight: 600; letter-spacing: 0; text-transform: none; }
```

- [ ] **Step 3: Build + dev** — `npm run build` → hatasız. `#/predictions`'da bayrak grid'inden şampiyon seçilince karnede "Şampiyon tahminin" görünmeli.

- [ ] **Step 4: Commit**
```bash
git add src/routes/Predictions.svelte
git commit -m "feat: add champion pick section to prediction hub"
```

---

## Faz 4 — Eleme bracket tahmini

### Task 13: BracketPredict bileşeni

**Files:** Create: `src/components/BracketPredict.svelte`

- [ ] **Step 1: Bileşeni yaz**

`src/components/BracketPredict.svelte`:
```svelte
<script>
  import { predictions } from '../lib/stores/predictions.js';
  import { getBracketRounds } from '../lib/utils/tournament.js';
  import { isBracketPredictable, scoreBracket } from '../lib/utils/prediction-scoring.js';
  import { teamById } from '../lib/stores/data.js';
  import Flag from './Flag.svelte';

  export let matches = [];
  export let teams = [];

  $: rounds = getBracketRounds(matches).filter((r) => r.matches.length);

  function pick(id, teamId, editable) {
    if (editable) predictions.setBracketPick(id, teamId);
  }
</script>

<div class="rounds">
  {#each rounds as round (round.stage)}
    <div class="round">
      <h4>{round.label}</h4>
      {#each round.matches as m (m.id)}
        {@const editable = isBracketPredictable(m, teams)}
        {@const choice = $predictions.bracketPicks[m.id]}
        {@const pts = m.status === 'finished' && choice ? scoreBracket(choice, m) : null}
        <div class="bm">
          <button class="side" class:on={choice === m.homeId} disabled={!editable}
            on:click={() => pick(m.id, m.homeId, editable)}>
            <Flag code={teamById(teams, m.homeId)?.flag} size={20} /> {teamById(teams, m.homeId)?.code ?? '—'}
          </button>
          <button class="side" class:on={choice === m.awayId} disabled={!editable}
            on:click={() => pick(m.id, m.awayId, editable)}>
            <Flag code={teamById(teams, m.awayId)?.flag} size={20} /> {teamById(teams, m.awayId)?.code ?? '—'}
          </button>
          {#if pts !== null}<span class="pts" class:win={pts > 0}>+{pts}</span>{/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .rounds { display: flex; flex-direction: column; gap: 16px; }
  .round h4 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
  .bm { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; margin-bottom: 8px; }
  .side {
    display: flex; align-items: center; gap: 7px; justify-content: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 9px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 12px;
  }
  .side.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .side:disabled { opacity: .6; cursor: default; }
  .pts { font-weight: 800; font-size: 12px; color: var(--muted); }
  .pts.win { color: var(--accent); }
</style>
```

- [ ] **Step 2: Build** — `npm run build` → hatasız.

- [ ] **Step 3: Commit**
```bash
git add src/components/BracketPredict.svelte
git commit -m "feat: add bracket prediction component"
```

---

### Task 14: Hub — bracket bölümü

**Files:** Modify: `src/routes/Predictions.svelte`

- [ ] **Step 1: Import + state**

`<script>` importlarına ekle:
```js
  import BracketPredict from '../components/BracketPredict.svelte';
  import { isBracketPredictable } from '../lib/utils/prediction-scoring.js';
```
Reaktif satırlara ekle:
```js
  $: hasBracket = $matches.some((m) => isBracketPredictable(m, $teams) || (['r32','r16','qf','sf','final'].includes(m.stage) && m.status === 'finished'));
```

- [ ] **Step 2: Bracket bölümü**

Şampiyon `</section>`'ının ALTINA ekle:
```svelte
  {#if hasBracket}
    <section>
      <h3 class="sec">Eleme tahminleri</h3>
      <BracketPredict matches={$matches} teams={$teams} />
    </section>
  {/if}
```

- [ ] **Step 3: Build + test** — `npm run build` → hatasız; `npm test` → geçer. (Seed/grup-öncesi veride eleme takımları belli değilse bölüm görünmez — beklenen.)

- [ ] **Step 4: Commit**
```bash
git add src/routes/Predictions.svelte
git commit -m "feat: add bracket prediction section to hub"
```

---

## Faz 5 — Paylaşım + cila

### Task 15: Puan kartı canvas çizimi

**Files:** Create: `src/lib/share/scorecard-canvas.js`

- [ ] **Step 1: Yaz**

`src/lib/share/scorecard-canvas.js`:
```js
export function renderScorecard(canvas, { total, accuracy, exactCount, championName }) {
  const W = 1080, H = 1080;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#15151c'); g.addColorStop(1, '#0b0b10');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ff2e63';
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('WORLDKICK', 80, 150);
  ctx.fillStyle = '#9a9aa6';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText('TAHMİN KARNESİ', 80, 200);

  ctx.fillStyle = '#f2f2f5';
  ctx.font = '800 240px system-ui, sans-serif';
  ctx.fillText(String(total), 76, 560);
  ctx.fillStyle = '#9a9aa6';
  ctx.font = '600 44px system-ui, sans-serif';
  ctx.fillText('PUAN', 88, 620);

  ctx.fillStyle = '#f2f2f5';
  ctx.font = '500 46px system-ui, sans-serif';
  ctx.fillText(`İsabet: %${accuracy}`, 80, 760);
  ctx.fillText(`Tam skor: ${exactCount}`, 80, 830);
  if (championName) ctx.fillText(`Şampiyon: ${championName}`, 80, 900);

  ctx.fillStyle = '#56565f';
  ctx.font = '500 32px system-ui, sans-serif';
  ctx.fillText('ilkaygkbdk.github.io/worldkick', 80, 1010);
}
```

- [ ] **Step 2: Build** — `npm run build` → hatasız.

- [ ] **Step 3: Commit**
```bash
git add src/lib/share/scorecard-canvas.js
git commit -m "feat: add shareable scorecard canvas renderer"
```

---

### Task 16: Hub — paylaş düğmesi

**Files:** Modify: `src/routes/Predictions.svelte`

- [ ] **Step 1: Import + paylaşım mantığı**

`<script>` importlarına ekle:
```js
  import { renderScorecard } from '../lib/share/scorecard-canvas.js';
```
`<script>` sonuna (reaktif blokların altına) ekle:
```js
  async function share() {
    const canvas = document.createElement('canvas');
    const acc = score.scoredCount ? Math.round((score.correctCount / score.scoredCount) * 100) : 0;
    renderScorecard(canvas, {
      total: score.total, accuracy: acc, exactCount: score.exactCount,
      championName: championTeam?.name ?? null,
    });
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], 'worldkick-tahmin.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'WorldKick tahmin karnem' }); return; } catch {}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'worldkick-tahmin.png'; a.click();
    URL.revokeObjectURL(url);
  }
```

- [ ] **Step 2: Düğmeyi ekle**

`PredictionScorecard` satırının hemen ALTINA ekle:
```svelte
  <button class="share" on:click={share}>Kartı paylaş</button>
```
`<style>` içine ekle:
```css
  .share { align-self: flex-start; background: var(--accent); color: #fff; border: none; border-radius: 999px; padding: 10px 18px; font-weight: 800; font-size: 13px; cursor: pointer; }
```

- [ ] **Step 3: Build + dev** — `npm run build` → hatasız. `#/predictions`'da "Kartı paylaş" tıklanınca PNG paylaşımı/indirmesi tetiklenmeli.

- [ ] **Step 4: Commit**
```bash
git add src/routes/Predictions.svelte
git commit -m "feat: add share scorecard button to prediction hub"
```

---

### Task 17: Maç detayında tahmin rozeti

**Files:** Modify: `src/routes/MatchDetail.svelte`

- [ ] **Step 1: Import + state**

`src/routes/MatchDetail.svelte` `<script>` importlarına ekle:
```js
  import { predictions } from '../lib/stores/predictions.js';
```
Reaktif satırlara ekle:
```js
  $: myPred = match ? $predictions.matchScores[match.id] : null;
```

- [ ] **Step 2: Rozeti göster**

`.hero` `</div>`'inin (kapanışın) hemen ALTINA, `.meta` `<div>`'inden ÖNCE ekle:
```svelte
    {#if myPred}
      <div class="mypred">Tahminin: <b>{myPred.home} - {myPred.away}</b></div>
    {/if}
```
`<style>` içine ekle:
```css
  .mypred { margin-top: 12px; text-align: center; font-size: 12px; color: var(--muted); }
  .mypred b { color: var(--accent); font-family: var(--font-head); }
```

- [ ] **Step 3: Build + test** — `npm run build` → hatasız; `npm test` → geçer.

- [ ] **Step 4: Commit**
```bash
git add src/routes/MatchDetail.svelte
git commit -m "feat: show user prediction badge on match detail"
```

---

## Self-Review Notları

- **Spec kapsamı:** veri modeli/store (Task 6) ✓; maç skoru puanlama (Task 2) ✓; bracket+şampiyon puanlama (Task 3) ✓; karne (Task 4) ✓; kilit/uygunluk (Task 5) ✓; `winner` veri ihtiyacı (Task 1) ✓; sekme/hub (Task 7,10) ✓; PredictMatch+stepper+kilit (Task 8) ✓; Scorecard (Task 9) ✓; ChampionPicker (Task 11,12) ✓; BracketPredict (Task 13,14) ✓; paylaşım kartı (Task 15,16) ✓; maç-detay rozeti (Task 17) ✓.
- **Tip/imza tutarlılığı:** store API'si (`setMatchScore(id,home,away)`, `setBracketPick(id,teamId)`, `setChampion(teamId)`) tüm bileşenlerde aynı; `computePredictionScore` çıktısı (`total/scoredCount/correctCount/exactCount/best/championPoints`) Scorecard ve paylaşımda tutarlı kullanılır; `scoreMatch/scoreBracket/championOf/isMatchPredictable/isBracketPredictable/isChampionLocked` imzaları sabit; maç `winner` alanı Task 1'de eklenir, Task 3/4 ve BracketPredict onu kullanır.
- **Placeholder yok:** Tüm adımlarda tam kod / kesin ekleme talimatı var.
- **Mevcut sisteme etki:** `prediction-scoring`, `predictions` store ve yeni bileşenler izole; mevcut akışları değiştirmez. Tek şema değişikliği `winner` (geriye dönük uyumlu; eski JSON'da yoksa `scoreBracket`/`championOf` 0/null döner). Cron bir sonraki çalışmada `winner`'ı doldurur.
- **Svelte 5 notu:** `{@const}` yalnızca `{#each}` gibi blok çocuğu olarak kullanıldı (BracketPredict). Route bileşenleri `params` prop'u kullanır (bu planda yeni parametreli route yok).
