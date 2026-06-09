# Tahmin Oyunu v2 (Kilit · Ağaç · Paylaşım) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tahmin Oyunu'nu turnuva-öncesi tek-kilit modeline geçirmek; katmanlı bracket ağacı (16→8→4→2→şampiyon), artan tur puanı ve URL ile salt-okunur paylaşım eklemek.

**Architecture:** Saf mantık (`bracket-rules.js`, `prediction-scoring.js` v2, `predictions-url.js`) TDD'li. Tahminler `localStorage`'da `predictions` store'unda (bracket katman listeleri). Kilit, açılış maçı başlayınca globaldir. Task'lar build'i her adımda yeşil tutacak sırada: önce yeni fonksiyonlar, sonra tüketiciler, en son eski kod temizliği.

**Tech Stack:** Svelte 5, svelte-spa-router v5, Vitest, lz-string (URL sıkıştırma).

**Mevcut kod (referans):**
- `src/lib/utils/prediction-scoring.js` → `scoreMatch, BRACKET_WEIGHTS, scoreBracket, championOf, computePredictionScore, isMatchPredictable, isBracketPredictable, isChampionLocked`. (v2'de bir kısmı eklenir/değişir/silinir.)
- `src/lib/stores/predictions.js` → `predictions` + `setMatchScore, clearMatchScore, setBracketPick, setChampion`; state `{matchScores, bracketPicks, champion}`.
- Bileşenler: `PredictMatch.svelte` (isMatchPredictable kullanır), `PredictionScorecard.svelte` (prop `score`,`championTeam`), `ChampionPicker.svelte`, `BracketPredict.svelte` (setBracketPick/isBracketPredictable kullanır), `Predictions.svelte` (hub), `MatchDetail.svelte`.
- `src/lib/stores/data.js` → `matches`,`teams`,`teamById`. `src/components/Flag.svelte`. `src/App.svelte` `routes`.
- Maç şeması: `{id, stage('group'|'r16'|'qf'|'sf'|'final'|...), homeId, awayId, datetimeUTC, status, homeScore, awayScore, winner}`.
- Test: `npm test -- <ad>`; Build: `npm run build`.

---

### Task 1: Bracket katman kuralları (TDD)

**Files:** Create `src/lib/utils/bracket-rules.js`, `src/lib/utils/bracket-rules.test.js`

- [ ] **Step 1: Başarısız test**

`src/lib/utils/bracket-rules.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { toggleTier, CAP } from './bracket-rules.js';

const empty = () => ({ r16: [], qf: [], sf: [], final: [] });

describe('toggleTier', () => {
  it('r16\'ya ekler', () => {
    expect(toggleTier(empty(), 'r16', 'A').r16).toEqual(['A']);
  });
  it('qf\'ye eklemek için r16\'da olmalı', () => {
    expect(toggleTier(empty(), 'qf', 'A').qf).toEqual([]); // r16\'da yok → eklenmez
    const b = toggleTier(empty(), 'r16', 'A');
    expect(toggleTier(b, 'qf', 'A').qf).toEqual(['A']);
  });
  it('kapasiteyi aşmaz', () => {
    let b = empty();
    for (let i = 0; i < CAP.final + 2; i++) {
      b = toggleTier(b, 'r16', 'T' + i);
      b = toggleTier(b, 'qf', 'T' + i);
      b = toggleTier(b, 'sf', 'T' + i);
      b = toggleTier(b, 'final', 'T' + i);
    }
    expect(b.final.length).toBe(CAP.final); // 2
  });
  it('alt kattan çıkarmak üst katlardan da düşürür', () => {
    let b = empty();
    b = toggleTier(b, 'r16', 'A'); b = toggleTier(b, 'qf', 'A'); b = toggleTier(b, 'sf', 'A');
    b = toggleTier(b, 'r16', 'A'); // r16\'dan çıkar → hepsinden düşmeli
    expect(b).toEqual(empty());
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — `npm test -- bracket-rules` → FAIL.

- [ ] **Step 3: Implementasyon**

`src/lib/utils/bracket-rules.js`:
```js
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
    // bu kattan ve tüm üst katlardan çıkar
    for (let i = idx; i < ORDER.length; i++) {
      b[ORDER[i]] = b[ORDER[i]].filter((x) => x !== teamId);
    }
    return b;
  }
  // eklemek için bir alt katta olmalı (r16 hariç) ve kapasite uygun
  if (idx > 0 && !b[ORDER[idx - 1]].includes(teamId)) return b;
  if (b[tier].length >= CAP[tier]) return b;
  b[tier] = [...b[tier], teamId];
  return b;
}
```

- [ ] **Step 4: Geçti doğrula** — `npm test -- bracket-rules` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/utils/bracket-rules.js src/lib/utils/bracket-rules.test.js
git commit -m "feat: add bracket tier rules"
```
COMMIT KURALI: Conventional Commits, ASLA Co-Authored-By, --author yok.

---

### Task 2: Skorlama v2 — reachedRound/tier/champion/lock (TDD)

**Files:** Modify `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js` (APPEND — mevcut testleri/fonksiyonları silme)

- [ ] **Step 1: Test ekle (SONA)**

```js
import { reachedRound, scoreBracketTree, scoreChampion, isLocked, TIER_WEIGHTS } from './prediction-scoring.js';

const koMatches = [
  { stage: 'qf', status: 'finished', homeId: 'A', awayId: 'B', winner: 'A' },
  { stage: 'final', status: 'finished', homeId: 'A', awayId: 'C', winner: 'A' },
];

describe('reachedRound', () => {
  it('her tura ulaşan takımları ve şampiyonu bulur', () => {
    const r = reachedRound(koMatches);
    expect([...r.qf].sort()).toEqual(['A', 'B']);
    expect([...r.final].sort()).toEqual(['A', 'C']);
    expect(r.champion).toBe('A');
  });
});

describe('scoreBracketTree', () => {
  it('katmanlardaki doğru takımları ağırlıkla toplar', () => {
    const bracket = { r16: ['A'], qf: ['A'], sf: [], final: ['A', 'C'] };
    // qf: A doğru (+2); final: A ve C doğru (+6+6); r16: ulaşan yok (0); sf boş
    expect(scoreBracketTree(bracket, koMatches)).toBe(TIER_WEIGHTS.qf + TIER_WEIGHTS.final * 2);
  });
});

describe('scoreChampion', () => {
  it('final kazananı şampiyon tahminiyse 10', () => {
    expect(scoreChampion('A', koMatches)).toBe(10);
    expect(scoreChampion('C', koMatches)).toBe(0);
  });
});

describe('isLocked', () => {
  const ms = [{ datetimeUTC: '2026-06-11T20:00:00Z' }, { datetimeUTC: '2026-06-12T18:00:00Z' }];
  it('en erken maç başladıysa true', () => {
    expect(isLocked(ms, Date.parse('2026-06-11T21:00:00Z'))).toBe(true);
    expect(isLocked(ms, Date.parse('2026-06-11T10:00:00Z'))).toBe(false);
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — `npm test -- prediction-scoring` → FAIL.

- [ ] **Step 3: Implementasyon (SONA ekle)**

```js
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
```

- [ ] **Step 4: Geçti doğrula** — `npm test -- prediction-scoring` → PASS (eski + yeni). `npm run build` hâlâ yeşil (eski fonksiyonlar duruyor).

- [ ] **Step 5: Commit**
```bash
git add src/lib/utils/prediction-scoring.js src/lib/utils/prediction-scoring.test.js
git commit -m "feat: add v2 bracket-tree and lock scoring"
```

---

### Task 3: computePredictionScore v2 (TDD)

**Files:** Modify `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js`

> Mevcut `computePredictionScore` bracket'i `bracketPicks` + `scoreBracket` ile sayıyor. v2: `scoreBracketTree` + `scoreChampion` kullanır.

- [ ] **Step 1: Mevcut computePredictionScore testini güncelle**

`prediction-scoring.test.js` içindeki `describe('computePredictionScore', ...)` bloğunu TAMAMEN şununla değiştir:
```js
describe('computePredictionScore', () => {
  const matches = [
    { id: 'm1', stage: 'group', status: 'finished', homeScore: 2, awayScore: 1, winner: 'A' },
    { id: 'k1', stage: 'qf', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A', homeId: 'A', awayId: 'B' },
    { id: 'f1', stage: 'final', status: 'finished', homeScore: 1, awayScore: 0, winner: 'A', homeId: 'A', awayId: 'C' },
  ];
  const predictions = {
    matchScores: { m1: { home: 2, away: 1 } },
    bracket: { r16: ['A'], qf: ['A'], sf: [], final: ['A'] },
    champion: 'A',
  };

  it('maç + bracket-ağaç + şampiyon puanlarını toplar', () => {
    const s = computePredictionScore(predictions, matches);
    expect(s.matchPoints).toBe(5);      // m1 tam skor
    expect(s.bracketPoints).toBe(8);    // qf:A +2, final:A +6, r16:A ulaşılan yok 0
    expect(s.championPoints).toBe(10);
    expect(s.total).toBe(23);
    expect(s.scoredCount).toBe(1);
    expect(s.exactCount).toBe(1);
    expect(s.best).toEqual({ matchId: 'm1', points: 5 });
  });
});
```

- [ ] **Step 2: Başarısız doğrula** — `npm test -- prediction-scoring` → FAIL.

- [ ] **Step 3: computePredictionScore'u değiştir**

`prediction-scoring.js` içindeki mevcut `computePredictionScore` fonksiyonunu TAMAMEN şununla değiştir:
```js
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
```

- [ ] **Step 4: Geçti doğrula** — `npm test -- prediction-scoring` → PASS. `npm run build` yeşil. (Eski `scoreBracket/championOf/BRACKET_WEIGHTS` hâlâ dosyada ama artık computePredictionScore kullanmıyor; Task 10'da temizlenecek.)

- [ ] **Step 5: Commit**
```bash
git add src/lib/utils/prediction-scoring.js src/lib/utils/prediction-scoring.test.js
git commit -m "feat: switch scorecard to bracket-tree scoring"
```

---

### Task 4: predictions store v2

**Files:** Modify `src/lib/stores/predictions.js`

> `bracketPicks` → `bracket` katmanları. `toggleTier` (bracket-rules) + şampiyon final-içinde guard'ı. Eski `setBracketPick` kaldırılır (tek tüketicisi BracketPredict; Task 5'te hub'dan çıkarılıyor — bu task ondan ÖNCE gelirse build kırılır, o yüzden Task 5 bu task'tan ÖNCE yapılır). **NOT:** Bu task Task 5'ten SONRA uygulanmalı. (Aşağıda sıra: 5 → 4.)

- [ ] **Step 1: Store'u değiştir**

`src/lib/stores/predictions.js` içeriğini TAMAMEN şununla değiştir:
```js
import { writable } from 'svelte/store';
import { toggleTier as applyTier } from '../lib/utils/bracket-rules.js';

const KEY = 'wk-predictions';
const EMPTY = { matchScores: {}, bracket: { r16: [], qf: [], sf: [], final: [] }, champion: null };

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v === 'object') {
      return {
        matchScores: v.matchScores ?? {},
        bracket: { r16: [], qf: [], sf: [], final: [], ...(v.bracket ?? {}) },
        champion: v.champion ?? null,
      };
    }
  } catch {}
  return structuredClone(EMPTY);
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
    toggleTier(tier, teamId) {
      update((s) => {
        const bracket = applyTier(s.bracket, tier, teamId);
        const champion = bracket.final.includes(s.champion) ? s.champion : null;
        const n = { ...s, bracket, champion };
        persist(n); return n;
      });
    },
    setChampion(teamId) {
      update((s) => {
        if (!s.bracket.final.includes(teamId)) return s; // sadece finaldeki 2 takımdan
        const n = { ...s, champion: teamId }; persist(n); return n;
      });
    },
  };
}

export const predictions = createPredictions();
```

> NOTE on import path: `bracket-rules.js` is at `src/lib/utils/`. From `src/lib/stores/` the relative path is `../utils/bracket-rules.js`. FIX the import to `import { toggleTier as applyTier } from '../utils/bracket-rules.js';`

- [ ] **Step 2: Build + test** — `npm run build` → hatasız; `npm test` → geçer.

- [ ] **Step 3: Commit**
```bash
git add src/lib/stores/predictions.js
git commit -m "feat: predictions store v2 with bracket tiers"
```

---

### Task 5 (Task 4'ten ÖNCE uygulanır): Hub'ı ara duruma getir

**Files:** Modify `src/routes/Predictions.svelte`

> Eski `BracketPredict` + `ChampionPicker` + `setBracketPick`/`isBracketPredictable` tüketimini hub'dan kaldırır ki store v2 (Task 4) build'i kırmasın. Bracket yerine geçici "yakında" notu; sonraki task'lar BracketTree ile dolduracak. Maç skorları + scorecard kalır.

- [ ] **Step 1: READ** `src/routes/Predictions.svelte` (mevcut yapı).

- [ ] **Step 2:** `<script>`'ten şu importları SİL: `ChampionPicker`, `BracketPredict`, `isChampionLocked`, `isBracketPredictable` (varsa). Şu reaktifleri sil: `champLocked`, `hasBracket` (varsa) ve şampiyon/bracket bölümlerini şablondan çıkar. `realTeams` reaktifini KORU. Şablonda `<ChampionPicker .../>` bölümünü ve `{#if hasBracket}...<BracketPredict.../>...{/if}` bölümünü tamamen kaldır, yerine ekleme YAPMA (BracketTree Task 8'de gelecek).

- [ ] **Step 3: Build + test** — `npm run build` → hatasız (artık setBracketPick/isBracketPredictable tüketilmiyor); `npm test` → geçer.

- [ ] **Step 4: Commit**
```bash
git add src/routes/Predictions.svelte
git commit -m "refactor: remove legacy bracket/champion from prediction hub"
```

> Uygulama sırası: **Task 1 → 2 → 3 → 5 → 4 → 6 → 7 → 8 → 9 → 10.** (Task 5 numara olarak burada ama Task 4'ten önce yapılır; subagent yöneticisi bu sırayı izlesin.)

---

### Task 6: PredictMatch global kilit

**Files:** Modify `src/components/PredictMatch.svelte`

- [ ] **Step 1: READ** dosyayı.

- [ ] **Step 2:** Importu değiştir — `isMatchPredictable` yerine `isLocked` ve `matches` store'u:
  - `import { isLocked } from '../lib/utils/prediction-scoring.js';` ve `import { matches } from '../lib/stores/data.js';`
  - Reaktif: `$: editable = isMatchPredictable(match);` satırını `$: editable = !isLocked($matches);` ile değiştir.

- [ ] **Step 3: Build + test** — `npm run build` → hatasız; `npm test` → geçer.

- [ ] **Step 4: Commit**
```bash
git add src/components/PredictMatch.svelte
git commit -m "feat: lock match predictions globally at tournament start"
```

---

### Task 7: LockBanner bileşeni + hub entegrasyonu

**Files:** Create `src/components/LockBanner.svelte`; Modify `src/routes/Predictions.svelte`

- [ ] **Step 1: LockBanner.svelte**
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { isLocked } from '../lib/utils/prediction-scoring.js';
  import { getCountdown } from '../lib/utils/countdown.js';
  export let matches = [];

  $: opening = [...matches].sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))[0] ?? null;
  $: locked = isLocked(matches);

  let cd = { days: 0, hours: 0, minutes: 0 };
  let timer;
  onMount(() => {
    const tick = () => { if (opening) cd = getCountdown(Date.parse(opening.datetimeUTC)); };
    tick();
    timer = setInterval(tick, 1000 * 30);
  });
  onDestroy(() => clearInterval(timer));
  const pad = (n) => String(n).padStart(2, '0');
</script>

{#if opening}
  <div class="bar" class:locked>
    {#if locked}
      🔒 Tahminler kilitlendi — turnuva başladı
    {:else}
      ⏳ Tahminler kilitlenmeden
      <span class="pill">{cd.days}g {pad(cd.hours)}s {pad(cd.minutes)}d</span>
    {/if}
  </div>
{/if}

<style>
  .bar {
    display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700;
    padding: 10px 13px; border-radius: 12px; color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
  }
  .bar.locked { color: var(--muted); background: var(--surface); border-color: var(--border); }
  .pill { margin-left: auto; background: var(--accent); color: #fff; border-radius: 999px; padding: 2px 9px; font-size: 11px; }
</style>
```

- [ ] **Step 2: Hub'a ekle** — `Predictions.svelte` `<script>`'e `import LockBanner from '../components/LockBanner.svelte';`. Şablonda `<h2>Tahminlerin</h2>`'in hemen ALTINA `<LockBanner matches={$matches} />` ekle.

- [ ] **Step 3: Build + dev** — `npm run build` hatasız; `npm test` geçer.

- [ ] **Step 4: Commit**
```bash
git add src/components/LockBanner.svelte src/routes/Predictions.svelte
git commit -m "feat: add prediction lock countdown banner"
```

---

### Task 8: BracketTree bileşeni + hub entegrasyonu

**Files:** Create `src/components/BracketTree.svelte`; Modify `src/routes/Predictions.svelte`

- [ ] **Step 1: BracketTree.svelte**
```svelte
<script>
  import { predictions } from '../lib/stores/predictions.js';
  import { reachedRound } from '../lib/utils/prediction-scoring.js';
  import Flag from './Flag.svelte';

  export let bracket;          // { r16, qf, sf, final }
  export let champion = null;
  export let matches = [];
  export let teams = [];
  export let readonly = false;

  // Tepeden aşağı: Şampiyon, Final, Yarı, Çeyrek, Son 16
  const TIERS = [
    { key: 'final', label: 'Final', pts: 6 },
    { key: 'sf', label: 'Yarı Final', pts: 4 },
    { key: 'qf', label: 'Çeyrek Final', pts: 2 },
    { key: 'r16', label: 'Son 16', pts: 1 },
  ];

  $: realTeams = teams.filter((t) => t.group && t.group !== '?');
  $: reached = reachedRound(matches);

  function team(id) { return teams.find((t) => t.id === id) ?? null; }
  // Bir kat için aday havuzu: r16 → tüm takımlar; diğerleri → bir alttaki kat (daha geniş set)
  function candidates(tierKey) {
    if (tierKey === 'r16') return realTeams.map((t) => t.id);
    const lower = { qf: 'r16', sf: 'qf', final: 'sf' }[tierKey];
    return bracket[lower] ?? [];
  }
  function pool(tierKey) {
    const chosen = new Set(bracket[tierKey] ?? []);
    return candidates(tierKey).filter((id) => !chosen.has(id));
  }
  function correct(tierKey, id) { return reached[tierKey]?.has(id); }
</script>

<div class="tree">
  <!-- Şampiyon -->
  <div class="champ">
    <div class="tlab">Şampiyonun</div>
    {#if champion}
      <button class="cup" class:ok={reached.champion === champion} disabled={readonly}
        on:click={() => !readonly && predictions.setChampion(champion)}>
        <Flag code={team(champion)?.flag} size={30} /> {team(champion)?.name ?? champion} 🏆
      </button>
    {:else}
      <div class="hint">Finaldeki takımlardan birine dokun</div>
    {/if}
  </div>

  <div class="spine"></div>

  {#each TIERS as tier (tier.key)}
    <div class="tier">
      <div class="thead"><span class="t">{tier.label}</span><span class="pp">+{tier.pts}</span></div>
      <div class="chips">
        {#each bracket[tier.key] ?? [] as id (id)}
          <button class="chip on" class:ok={correct(tier.key, id)} disabled={readonly}
            on:click={() => {
              if (readonly) return;
              if (tier.key === 'final') predictions.setChampion(id);
              else predictions.toggleTier(tier.key, id);
            }}>
            <Flag code={team(id)?.flag} size={18} /> {team(id)?.code ?? id}
          </button>
        {/each}
      </div>
      {#if !readonly}
        <div class="cands">
          {#each pool(tier.key) as id (id)}
            <button class="chip" on:click={() => predictions.toggleTier(tier.key, id)}>
              <Flag code={team(id)?.flag} size={16} /> {team(id)?.code ?? id}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .tree { display: flex; flex-direction: column; gap: 14px; position: relative; }
  .champ { text-align: center; }
  .tlab { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); font-weight: 800; margin-bottom: 8px; }
  .cup { display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer;
    padding: 10px 18px; border-radius: 16px; color: #fff; font-weight: 800; font-size: 15px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #fff));
    box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 40%, transparent); }
  .cup.ok { outline: 2px solid #2ecc71; }
  .hint { color: var(--muted); font-size: 12px; }
  .spine { width: 2px; height: 6px; align-self: center; background: var(--accent); border-radius: 2px; }
  .tier { text-align: center; }
  .thead { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
  .thead .t { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); font-weight: 800; }
  .thead .pp { background: var(--surface); border: 1px solid var(--border); color: var(--accent); border-radius: 999px; font-size: 9px; font-weight: 800; padding: 2px 7px; }
  .chips, .cands { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .cands { margin-top: 6px; opacity: .6; }
  .chip { display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: 700; font-size: 11px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px 4px 4px; color: var(--text); }
  .chip.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .chip.ok { outline: 2px solid #2ecc71; }
  .chip:disabled { cursor: default; }
</style>
```

- [ ] **Step 2: Hub'a ekle** — `Predictions.svelte` `<script>`'e `import BracketTree from '../components/BracketTree.svelte';`. Maç skorları bölümünden ÖNCE (scorecard'ın altına) ekle:
```svelte
  {#if realTeams.length}
    <section>
      <h3 class="sec">Bracket ağacın</h3>
      <BracketTree bracket={$predictions.bracket} champion={$predictions.champion} matches={$matches} teams={$teams} />
    </section>
  {/if}
```
(`realTeams` reaktifi hub'da zaten var — Task 5'te korunmuştu.)

- [ ] **Step 3: Build + dev** — `npm run build` hatasız; `npm test` geçer. Dev: `#/predictions`'da kat aday çiplerinden seçim yapılınca ağaç dolar, finaldeki bir takıma dokununca şampiyon olur, kapasiteler korunur.

- [ ] **Step 4: Commit**
```bash
git add src/components/BracketTree.svelte src/routes/Predictions.svelte
git commit -m "feat: add bracket tree builder and visualization"
```

---

### Task 9: URL paylaşımı (encode/decode + paylaşılan görünüm + buton)

**Files:** Create `src/lib/share/predictions-url.js`, `src/lib/share/predictions-url.test.js`, `src/routes/SharedPrediction.svelte`; Modify `src/App.svelte`, `src/routes/Predictions.svelte`

- [ ] **Step 1: lz-string kur** — Run: `npm install lz-string`

- [ ] **Step 2: encode/decode testi (TDD)**

`src/lib/share/predictions-url.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { encodePredictions, decodePredictions } from './predictions-url.js';

describe('predictions-url', () => {
  it('round-trip korur', () => {
    const p = { matchScores: { m1: { home: 2, away: 1 } }, bracket: { r16: ['A'], qf: ['A'], sf: [], final: ['A'] }, champion: 'A' };
    const enc = encodePredictions(p);
    expect(typeof enc).toBe('string');
    expect(decodePredictions(enc)).toEqual(p);
  });
  it('geçersiz girdide null', () => {
    expect(decodePredictions('@@bozuk@@')).toBeNull();
  });
});
```

- [ ] **Step 3: Başarısız doğrula** — `npm test -- predictions-url` → FAIL.

- [ ] **Step 4: predictions-url.js**
```js
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

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
```

- [ ] **Step 5: Geçti doğrula** — `npm test -- predictions-url` → PASS.

- [ ] **Step 6: SharedPrediction.svelte**
```svelte
<script>
  import { matches, teams } from '../lib/stores/data.js';
  import { decodePredictions } from '../lib/share/predictions-url.js';
  import { computePredictionScore } from '../lib/utils/prediction-scoring.js';
  import PredictionScorecard from '../components/PredictionScorecard.svelte';
  import BracketTree from '../components/BracketTree.svelte';
  import { teamById } from '../lib/stores/data.js';

  export let params = {};
  $: shared = decodePredictions(params.payload);
  $: score = shared ? computePredictionScore(shared, $matches) : null;
  $: championTeam = shared?.champion ? teamById($teams, shared.champion) : null;
</script>

<div class="page">
  <button class="back" on:click={() => window.history.back()} aria-label="Geri">← Geri</button>
  {#if !shared}
    <p class="empty">Bu paylaşım bağlantısı geçersiz.</p>
    <a class="cta" href="#/predictions">Kendi tahminini yap →</a>
  {:else}
    <div class="tag">👋 Bir arkadaşının tahmini</div>
    <PredictionScorecard {score} {championTeam} />
    <section>
      <h3 class="sec">Bracket ağacı</h3>
      <BracketTree bracket={shared.bracket} champion={shared.champion} matches={$matches} teams={$teams} readonly={true} />
    </section>
    <a class="cta" href="#/predictions">Kendi tahminini yap →</a>
  {/if}
</div>

<style>
  .page { padding: 16px; display: flex; flex-direction: column; gap: 18px; }
  .back { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; padding: 0; font-size: 14px; align-self: flex-start; }
  .tag { font-size: 13px; font-weight: 700; color: var(--muted); }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 0 0 10px; }
  .cta { align-self: flex-start; background: var(--accent); color: #fff; text-decoration: none; border-radius: 999px; padding: 10px 18px; font-weight: 800; font-size: 13px; }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 7: App route** — `src/App.svelte`'e import `import SharedPrediction from './routes/SharedPrediction.svelte';` ve `routes`'a `'/predictions': Predictions,` ALTINA `'/p/:payload': SharedPrediction,` ekle.

- [ ] **Step 8: Hub'a URL paylaş butonu** — `Predictions.svelte` `<script>`'e:
```js
  import { encodePredictions } from '../lib/share/predictions-url.js';
  async function shareUrl() {
    const url = `${location.origin}${location.pathname}#/p/${encodePredictions($predictions)}`;
    if (navigator.share) { try { await navigator.share({ title: 'WorldKick tahminim', url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); alert('Bağlantı kopyalandı'); } catch {}
  }
```
Şablonda LockBanner'ın altına bir buton ekle: `<button class="urlshare" on:click={shareUrl}>🔗 Tahminimi paylaş</button>` ve `<style>`'a:
```css
  .urlshare { align-self: flex-start; background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 999px; padding: 9px 16px; font-weight: 800; font-size: 12px; cursor: pointer; }
```

- [ ] **Step 9: Build + dev** — `npm run build` hatasız; `npm test` geçer. Dev: "Tahminimi paylaş" → URL kopyalanır; o URL `#/p/...` açılınca salt-okunur ağaç + skor + "Kendi tahminini yap" görünür.

- [ ] **Step 10: Commit**
```bash
git add src/lib/share/predictions-url.js src/lib/share/predictions-url.test.js src/routes/SharedPrediction.svelte src/App.svelte src/routes/Predictions.svelte package.json package-lock.json
git commit -m "feat: add URL-encoded shareable read-only predictions"
```

---

### Task 10: Eski kodu temizle

**Files:** Delete `src/components/BracketPredict.svelte`, `src/components/ChampionPicker.svelte`; Modify `src/lib/utils/prediction-scoring.js`, `src/lib/utils/prediction-scoring.test.js`

- [ ] **Step 1: Kullanım kalmadığını doğrula** — Run: `grep -rn "BracketPredict\|ChampionPicker\|setBracketPick\|isBracketPredictable\|isMatchPredictable\|scoreBracket\b\|BRACKET_WEIGHTS\|championOf" src/` — yalnızca `prediction-scoring.js`/test'inde kalmalı (bileşen importu olmamalı). Varsa önce o tüketiciyi düzelt.

- [ ] **Step 2: Kullanılmayan bileşenleri sil**
```bash
git rm src/components/BracketPredict.svelte src/components/ChampionPicker.svelte
```

- [ ] **Step 3: Ölü fonksiyonları sil** — `prediction-scoring.js`'ten şunları KALDIR: `BRACKET_WEIGHTS`, `scoreBracket`, `isMatchPredictable`, `isBracketPredictable`, `isChampionLocked`, ve (artık reachedRound içinde olduğu için) `championOf`. `prediction-scoring.test.js`'ten bunlara ait `describe` bloklarını ve importlarını da KALDIR (scoreMatch, reachedRound, scoreBracketTree, scoreChampion, isLocked, computePredictionScore testleri kalır).

- [ ] **Step 4: Build + test** — `npm run build` → hatasız (hiçbir şey silinen fonksiyonları import etmiyor); `npm test` → tüm kalan testler geçer.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "refactor: remove legacy prediction bracket/lock code"
```

---

## Self-Review Notları

- **Spec kapsamı:** tek kilit (Task 2 `isLocked`, Task 6 PredictMatch, Task 7 banner) ✓; katmanlı bracket + kurallar (Task 1, 4, 8) ✓; tier puanı (Task 2, 3) ✓; URL salt-okunur paylaşım (Task 9) ✓; ağaç görselleştirme (Task 8) ✓; grup maç skoru korunur (computePredictionScore matchPoints) ✓; eski kod temizliği (Task 10) ✓.
- **Sıra/yeşil-build:** Uygulama sırası **1→2→3→5→4→6→7→8→9→10**. Task 5 (hub'dan eski bracket/champion'ı çıkar) Task 4'ten (store'dan setBracketPick'i kaldır) ÖNCE yapılır; aksi halde build kırılır. Bu, Task 5 başlığında ve sıra notunda açıkça belirtildi.
- **Tip/imza tutarlılığı:** `toggleTier(bracket, tier, teamId)` (bracket-rules) ↔ store `toggleTier(tier, teamId)`; `bracket = {r16,qf,sf,final}` her yerde; `reachedRound`/`scoreBracketTree`/`scoreChampion`/`isLocked`/`computePredictionScore` imzaları Task 2-3 ile bileşenlerde tutarlı; `encodePredictions/decodePredictions` round-trip; store import yolu `../utils/bracket-rules.js` (Task 4 Step 1 notunda düzeltildi).
- **Placeholder yok:** Tüm adımlarda tam kod / kesin düzenleme talimatı.
- **Geriye dönük veri:** store `load()` eski `bracketPicks`'i yok sayar, yeni `bracket` varsayılana düşer.
