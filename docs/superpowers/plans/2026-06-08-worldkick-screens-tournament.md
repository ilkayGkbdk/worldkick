# WorldKick — Ekranlar & Turnuva Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plan 1 iskeletinin üzerine fikstür filtreleri, maç/takım detay sayfaları, favoriler, grup puan durumu ve eleme bracket'ini ekleyerek uygulamanın tüm ekranlarını tamamlamak.

**Architecture:** Saf hesaplama mantığı (puan durumu, gün/grup gruplama, bracket turları) `src/lib/utils/` altında izole, Vitest ile TDD'li. Ekranlar svelte-spa-router route'ları; bileşenler `src/components/` altında. Favoriler `localStorage` tabanlı bir store. Tüm veri mevcut `src/lib/stores/data.js` store'larından (`teams`, `matches`) okunur.

**Tech Stack:** Svelte 5 (legacy `$:`/`$store` uyumlu mod), svelte-spa-router v5 (parametreli route'lar `params` prop'u ile, geçerli yol `router.location`), Vitest.

**Mevcut kod tabanı referansı (DEĞİŞTİRME, sadece kullan):**
- `src/lib/stores/data.js` → `teams, matches, meta, loadError` (writable store'lar), `loadAll()`, `teamById(list, id)`.
- `src/lib/utils/fixtures.js` → `getNextMatch(matches, nowMs?)`, `getMatchesOn(matches, ref?, tz?)`.
- `src/lib/utils/datetime.js` → `formatLocalTime(isoUtc, locale?, tz?)`, `formatLocalDate(isoUtc, locale?, tz?)`, `isSameLocalDay(isoUtc, ref?, tz?)`.
- `src/components/` → `Flag.svelte` (props `code`, `size`), `MatchRow.svelte` (props `match`, `home`, `away`), `CountdownCard.svelte`, `TabBar.svelte`, `ThemeToggle.svelte`.
- `src/routes/` → `Home.svelte` (bitti), `Fixtures.svelte` / `Tournament.svelte` / `Favorites.svelte` (placeholder — bu planda yeniden yazılacak).
- `src/App.svelte` → `routes` objesi: `{'/':Home,'/fixtures':Fixtures,'/tournament':Tournament,'/favorites':Favorites}`.
- Test komutu: `npm test -- <ad>` (tek dosya), `npm test` (hepsi). Build: `npm run build`.

---

### Task 1: Grup puan durumu hesabı (TDD)

**Files:**
- Create: `src/lib/utils/standings.js`
- Test: `src/lib/utils/standings.test.js`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/utils/standings.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { computeStandings } from './standings.js';

const teams = [
  { id: 'A1', group: 'A' }, { id: 'A2', group: 'A' }, { id: 'A3', group: 'A' },
  { id: 'B1', group: 'B' }, { id: 'B2', group: 'B' },
  { id: 'X', group: '?' },
];
const matches = [
  { id: 1, stage: 'group', group: 'A', homeId: 'A1', awayId: 'A2', status: 'finished', homeScore: 2, awayScore: 1 },
  { id: 2, stage: 'group', group: 'A', homeId: 'A2', awayId: 'A3', status: 'finished', homeScore: 0, awayScore: 0 },
  { id: 3, stage: 'group', group: 'A', homeId: 'A1', awayId: 'A3', status: 'scheduled', homeScore: null, awayScore: null },
  { id: 4, stage: 'r32', group: null, homeId: 'A1', awayId: 'B1', status: 'finished', homeScore: 3, awayScore: 0 },
];

describe('computeStandings', () => {
  it('bitmiş grup maçlarından puan durumunu hesaplar ve sıralar', () => {
    const result = computeStandings(matches, teams);
    const groupA = result.find((g) => g.group === 'A');
    expect(groupA.rows.map((r) => r.teamId)).toEqual(['A1', 'A3', 'A2']);
    expect(groupA.rows[0]).toMatchObject({ teamId: 'A1', P: 1, W: 1, D: 0, L: 0, GF: 2, GA: 1, GD: 1, Pts: 3 });
    expect(groupA.rows.find((r) => r.teamId === 'A2')).toMatchObject({ P: 2, W: 0, D: 1, L: 1, GF: 1, GA: 2, GD: -1, Pts: 1 });
    expect(groupA.rows.find((r) => r.teamId === 'A3')).toMatchObject({ P: 1, D: 1, GF: 0, GA: 0, GD: 0, Pts: 1 });
  });

  it("'?' grubunu ve grup-dışı (eleme) maçları yok sayar", () => {
    const result = computeStandings(matches, teams);
    expect(result.map((g) => g.group)).toEqual(['A', 'B']);
    // r32 maçı A1'in averajını etkilememeli (GA hâlâ 1)
    const a1 = result.find((g) => g.group === 'A').rows.find((r) => r.teamId === 'A1');
    expect(a1.GA).toBe(1);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- standings`
Expected: FAIL — modül/fonksiyon yok.

- [ ] **Step 3: Implementasyonu yaz**

`src/lib/utils/standings.js`:
```js
export function computeStandings(matches, teams) {
  const groups = new Map();
  for (const t of teams) {
    if (!t.group || t.group === '?') continue;
    if (!groups.has(t.group)) groups.set(t.group, new Map());
    groups.get(t.group).set(t.id, {
      teamId: t.id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0,
    });
  }

  for (const m of matches) {
    if (m.stage !== 'group' || m.status !== 'finished') continue;
    if (typeof m.homeScore !== 'number' || typeof m.awayScore !== 'number') continue;
    const g = groups.get(m.group);
    if (!g) continue;
    const home = g.get(m.homeId);
    const away = g.get(m.awayId);
    if (!home || !away) continue;

    home.P++; away.P++;
    home.GF += m.homeScore; home.GA += m.awayScore;
    away.GF += m.awayScore; away.GA += m.homeScore;
    if (m.homeScore > m.awayScore) { home.W++; home.Pts += 3; away.L++; }
    else if (m.homeScore < m.awayScore) { away.W++; away.Pts += 3; home.L++; }
    else { home.D++; away.D++; home.Pts++; away.Pts++; }
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([group, rowsMap]) => {
      const rows = [...rowsMap.values()];
      for (const r of rows) r.GD = r.GF - r.GA;
      rows.sort((x, y) =>
        y.Pts - x.Pts || y.GD - x.GD || y.GF - x.GF ||
        (x.teamId < y.teamId ? -1 : 1));
      return { group, rows };
    });
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- standings`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/standings.js src/lib/utils/standings.test.js
git commit -m "feat: add group standings computation"
```
COMMIT KURALI: Conventional Commits, ASLA Co-Authored-By, --author yok.

---

### Task 2: Fikstür gruplama yardımcıları (TDD)

**Files:**
- Modify: `src/lib/utils/fixtures.js` (mevcut export'lara ekleme — `getNextMatch`/`getMatchesOn`'a DOKUNMA)
- Modify (test ekle): `src/lib/utils/fixtures.test.js`

- [ ] **Step 1: Başarısız testleri ekle**

`src/lib/utils/fixtures.test.js` dosyasının SONUNA (mevcut testleri silme) ekle:
```js
import { getMatchdays, filterByGroup, getTeamMatches } from './fixtures.js';

describe('getMatchdays', () => {
  const ms = [
    { id: 1, datetimeUTC: '2026-06-11T20:00:00Z' },
    { id: 3, datetimeUTC: '2026-06-12T18:00:00Z' },
    { id: 2, datetimeUTC: '2026-06-11T23:00:00Z' },
  ];
  it('maçları güne göre gruplar, günleri ve maçları artan sıralar', () => {
    const days = getMatchdays(ms, 'UTC');
    expect(days.map((d) => d.key)).toEqual(['2026-06-11', '2026-06-12']);
    expect(days[0].matches.map((m) => m.id)).toEqual([1, 2]);
    expect(days[1].matches.map((m) => m.id)).toEqual([3]);
  });
});

describe('filterByGroup', () => {
  const ms = [
    { id: 1, group: 'A' }, { id: 2, group: 'F' }, { id: 3, group: 'A' },
  ];
  it('boş grup ile tüm maçları döner', () => {
    expect(filterByGroup(ms, '').map((m) => m.id)).toEqual([1, 2, 3]);
  });
  it('verilen gruba ait maçları döner', () => {
    expect(filterByGroup(ms, 'A').map((m) => m.id)).toEqual([1, 3]);
  });
});

describe('getTeamMatches', () => {
  const ms = [
    { id: 1, homeId: 'X', awayId: 'Y', datetimeUTC: '2026-06-12T18:00:00Z' },
    { id: 2, homeId: 'Z', awayId: 'X', datetimeUTC: '2026-06-11T18:00:00Z' },
    { id: 3, homeId: 'Y', awayId: 'Z', datetimeUTC: '2026-06-10T18:00:00Z' },
  ];
  it('takımın yer aldığı maçları zaman sırasıyla döner', () => {
    expect(getTeamMatches(ms, 'X').map((m) => m.id)).toEqual([2, 1]);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- fixtures`
Expected: FAIL — yeni fonksiyonlar export edilmedi.

- [ ] **Step 3: Implementasyonu ekle**

`src/lib/utils/fixtures.js` dosyasının SONUNA ekle (mevcut kodun altına):
```js
export function getMatchdays(matches, timeZone = undefined) {
  const byDay = new Map();
  for (const m of matches) {
    const key = new Date(m.datetimeUTC).toLocaleDateString('en-CA', { timeZone });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([key, ms]) => ({
      key,
      matches: ms.sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC)),
    }));
}

export function filterByGroup(matches, group) {
  if (!group) return matches;
  return matches.filter((m) => m.group === group);
}

export function getTeamMatches(matches, teamId) {
  return matches
    .filter((m) => m.homeId === teamId || m.awayId === teamId)
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- fixtures`
Expected: PASS (eski 3 + yeni 4 = 7 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/fixtures.js src/lib/utils/fixtures.test.js
git commit -m "feat: add matchday/group/team fixture helpers"
```

---

### Task 3: Eleme bracket turları (TDD)

**Files:**
- Create: `src/lib/utils/tournament.js`
- Test: `src/lib/utils/tournament.test.js`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/utils/tournament.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { getBracketRounds } from './tournament.js';

const matches = [
  { id: 'f', stage: 'final', datetimeUTC: '2026-07-19T19:00:00Z' },
  { id: 'r1', stage: 'r32', datetimeUTC: '2026-06-28T18:00:00Z' },
  { id: 'r2', stage: 'r32', datetimeUTC: '2026-06-28T22:00:00Z' },
  { id: 'q', stage: 'qf', datetimeUTC: '2026-07-10T18:00:00Z' },
  { id: 'grp', stage: 'group', datetimeUTC: '2026-06-11T18:00:00Z' },
];

describe('getBracketRounds', () => {
  it('5 turu sabit sırada döner ve grup maçlarını dışlar', () => {
    const rounds = getBracketRounds(matches);
    expect(rounds.map((r) => r.stage)).toEqual(['r32', 'r16', 'qf', 'sf', 'final']);
    expect(rounds[0].matches.map((m) => m.id)).toEqual(['r1', 'r2']);
    expect(rounds.find((r) => r.stage === 'r16').matches).toEqual([]);
    expect(rounds.find((r) => r.stage === 'final').matches.map((m) => m.id)).toEqual(['f']);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- tournament`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implementasyonu yaz**

`src/lib/utils/tournament.js`:
```js
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
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- tournament`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/tournament.js src/lib/utils/tournament.test.js
git commit -m "feat: add knockout bracket rounds helper"
```

---

### Task 4: matchById helper + favoriler store

**Files:**
- Modify: `src/lib/stores/data.js` (mevcut export'ların yanına `matchById` ekle — diğerlerine dokunma)
- Create: `src/lib/stores/favorites.js`

- [ ] **Step 1: data.js'e matchById ekle**

`src/lib/stores/data.js` dosyasının SONUNA, mevcut `teamById` fonksiyonunun hemen altına ekle:
```js
export function matchById(list, id) {
  return list.find((m) => String(m.id) === String(id)) ?? null;
}
```

- [ ] **Step 2: favorites store'unu yaz**

`src/lib/stores/favorites.js`:
```js
import { writable } from 'svelte/store';

const KEY = 'wk-favorites';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function createFavorites() {
  const { subscribe, update } = writable(load());
  function persist(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  return {
    subscribe,
    toggle(id) {
      update((list) => {
        const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
        persist(next);
        return next;
      });
    },
  };
}

export const favorites = createFavorites();
```

- [ ] **Step 3: Build'in geçtiğini doğrula**

Run: `npm run build`
Expected: hatasız. Run: `npm test` → tüm testler hâlâ geçer.

- [ ] **Step 4: Commit**

```bash
git add src/lib/stores/data.js src/lib/stores/favorites.js
git commit -m "feat: add matchById helper and favorites store"
```

---

### Task 5: FavoriteButton bileşeni

**Files:**
- Create: `src/components/FavoriteButton.svelte`

- [ ] **Step 1: Bileşeni yaz**

`src/components/FavoriteButton.svelte`:
```svelte
<script>
  import { favorites } from '../lib/stores/favorites.js';
  export let teamId;
  $: isFav = $favorites.includes(teamId);
</script>

<button
  class="fav"
  class:on={isFav}
  on:click|preventDefault|stopPropagation={() => favorites.toggle(teamId)}
  aria-pressed={isFav}
  aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
  {isFav ? '★' : '☆'}
</button>

<style>
  .fav {
    background: transparent; border: none; cursor: pointer;
    font-size: 20px; line-height: 1; color: var(--muted); padding: 4px;
  }
  .fav.on { color: var(--accent); }
</style>
```

- [ ] **Step 2: Build'in geçtiğini doğrula**

Run: `npm run build`
Expected: hatasız.

- [ ] **Step 3: Commit**

```bash
git add src/components/FavoriteButton.svelte
git commit -m "feat: add favorite toggle button"
```

---

### Task 6: Fikstür ekranı (gün grupları + grup filtresi)

**Files:**
- Modify: `src/routes/Fixtures.svelte` (placeholder'ı tamamen değiştir)

- [ ] **Step 1: Fixtures.svelte'i yaz**

`src/routes/Fixtures.svelte` içeriğini TAMAMEN şununla değiştir:
```svelte
<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { getMatchdays, filterByGroup } from '../lib/utils/fixtures.js';
  import { formatLocalDate } from '../lib/utils/datetime.js';
  import MatchRow from '../components/MatchRow.svelte';

  let group = '';
  $: groups = [...new Set($teams.map((t) => t.group).filter((g) => g && g !== '?'))].sort();
  $: days = getMatchdays(filterByGroup($matches, group));
</script>

<div class="page">
  <h2>Fikstür</h2>

  <div class="chips">
    <button class="chip" class:on={group === ''} on:click={() => (group = '')}>Tümü</button>
    {#each groups as g}
      <button class="chip" class:on={group === g} on:click={() => (group = g)}>Grup {g}</button>
    {/each}
  </div>

  {#each days as day (day.key)}
    <h3 class="day">{formatLocalDate(day.matches[0].datetimeUTC)}</h3>
    {#each day.matches as m (m.id)}
      <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
    {/each}
  {/each}

  {#if days.length === 0}
    <p class="empty">Maç bulunamadı.</p>
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; }
  .chip {
    flex: 0 0 auto; background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); border-radius: 999px; padding: 6px 14px; font-size: 12px;
    font-weight: 700; cursor: pointer; white-space: nowrap;
  }
  .chip.on { background: var(--accent); color: #fff; border-color: var(--accent); }
  .day {
    font-size: 12px; text-transform: uppercase; letter-spacing: 2px;
    color: var(--muted); margin: 18px 0 10px;
  }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 2: Build + dev doğrulaması**

Run: `npm run build` → hatasız. Run: `npm test` → testler geçer.
İsteğe bağlı görsel kontrol: `npm run dev`, `#/fixtures` route'unda gün başlıkları, grup çipleri (Tümü/Grup A/Grup F) ve maç satırları görünmeli; çipe tıklayınca liste filtrelenmeli.

- [ ] **Step 3: Commit**

```bash
git add src/routes/Fixtures.svelte
git commit -m "feat: build fixtures screen with day groups and group filter"
```

---

### Task 7: Maç detay sayfası + route

**Files:**
- Create: `src/routes/MatchDetail.svelte`
- Modify: `src/App.svelte` (route ekle)

- [ ] **Step 1: MatchDetail.svelte'i yaz**

`src/routes/MatchDetail.svelte`:
```svelte
<script>
  import { matches, teams, teamById, matchById } from '../lib/stores/data.js';
  import { formatLocalDate, formatLocalTime } from '../lib/utils/datetime.js';
  import Flag from '../components/Flag.svelte';

  export let params = {};
  $: match = matchById($matches, params.id);
  $: home = match ? teamById($teams, match.homeId) : null;
  $: away = match ? teamById($teams, match.awayId) : null;
  $: finished = match?.status === 'finished';
</script>

<div class="page">
  <button class="back" on:click={() => window.history.back()} aria-label="Geri">← Geri</button>

  {#if !match}
    <p class="empty">Maç bulunamadı.</p>
  {:else}
    <div class="hero">
      <a class="side" href={`#/team/${match.homeId}`}>
        <Flag code={home?.flag} size={56} />
        <span>{home?.name ?? match.homeId}</span>
      </a>
      <div class="center">
        {#if finished}
          <div class="score">{match.homeScore} - {match.awayScore}</div>
        {:else}
          <div class="time">{formatLocalTime(match.datetimeUTC)}</div>
          <div class="vs">VS</div>
        {/if}
      </div>
      <a class="side" href={`#/team/${match.awayId}`}>
        <Flag code={away?.flag} size={56} />
        <span>{away?.name ?? match.awayId}</span>
      </a>
    </div>

    <div class="meta">
      <div><span class="k">Tarih</span><span>{formatLocalDate(match.datetimeUTC)} · {formatLocalTime(match.datetimeUTC)}</span></div>
      <div><span class="k">Stat</span><span>{match.venue}</span></div>
      <div><span class="k">Şehir</span><span>{match.city}</span></div>
      {#if match.group}
        <div><span class="k">Grup</span><span>{match.group}</span></div>
      {/if}
    </div>

    {#if match.scorers && match.scorers.length}
      <h3 class="sec">Goller</h3>
      <ul class="scorers">
        {#each match.scorers as s, i (i)}
          <li>{s.name}{#if s.minute} <span class="min">{s.minute}'</span>{/if}</li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .back { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; padding: 0 0 12px; font-size: 14px; }
  .hero { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; background: var(--surface); border-radius: 18px; padding: 22px 14px; box-shadow: var(--shadow); border-top: 3px solid var(--accent); }
  .side { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: var(--text); font-weight: 700; font-size: 13px; text-align: center; }
  .center { text-align: center; }
  .score { font-family: var(--font-head); font-size: 34px; font-weight: 800; }
  .time { font-weight: 800; font-size: 18px; }
  .vs { color: var(--muted); font-size: 12px; font-weight: 800; }
  .meta { margin-top: 16px; display: flex; flex-direction: column; gap: 1px; background: var(--border); border-radius: 14px; overflow: hidden; }
  .meta > div { display: flex; justify-content: space-between; background: var(--surface); padding: 12px 14px; font-size: 13px; }
  .k { color: var(--muted); }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 20px 0 10px; }
  .scorers { list-style: none; padding: 0; margin: 0; }
  .scorers li { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .min { color: var(--muted); }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 2: App.svelte'e route ekle**

`src/App.svelte` içinde önce import satırlarına ekle (diğer route importlarının yanına):
```js
  import MatchDetail from './routes/MatchDetail.svelte';
```
Sonra `routes` objesine `'/favorites': Favorites,` satırının ALTINA ekle:
```js
    '/match/:id': MatchDetail,
```

- [ ] **Step 3: Build + doğrulama**

Run: `npm run build` → hatasız. Run: `npm test` → geçer.
İsteğe bağlı: `npm run dev`, ana ekrandaki geri sayım kartına veya bir maç satırına tıkla → `#/match/m1` açılmalı, takım/saat/stat bilgisi görünmeli, "← Geri" çalışmalı.

- [ ] **Step 4: Commit**

```bash
git add src/routes/MatchDetail.svelte src/App.svelte
git commit -m "feat: add match detail page"
```

---

### Task 8: Takım detay sayfası + route

**Files:**
- Create: `src/routes/TeamDetail.svelte`
- Modify: `src/App.svelte` (route ekle)

- [ ] **Step 1: TeamDetail.svelte'i yaz**

`src/routes/TeamDetail.svelte`:
```svelte
<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { getTeamMatches } from '../lib/utils/fixtures.js';
  import MatchRow from '../components/MatchRow.svelte';
  import FavoriteButton from '../components/FavoriteButton.svelte';
  import Flag from '../components/Flag.svelte';

  export let params = {};
  $: team = teamById($teams, params.id);
  $: teamMatches = getTeamMatches($matches, params.id);
</script>

<div class="page">
  <button class="back" on:click={() => window.history.back()} aria-label="Geri">← Geri</button>

  {#if !team}
    <p class="empty">Takım bulunamadı.</p>
  {:else}
    <div class="head">
      <Flag code={team.flag} size={56} />
      <div class="info">
        <h2>{team.name}</h2>
        {#if team.group && team.group !== '?'}<span class="grp">Grup {team.group}</span>{/if}
      </div>
      <FavoriteButton teamId={team.id} />
    </div>

    <h3 class="sec">Maçlar</h3>
    {#each teamMatches as m (m.id)}
      <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
    {/each}
    {#if teamMatches.length === 0}
      <p class="empty">Maç bulunamadı.</p>
    {/if}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .back { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; padding: 0 0 12px; font-size: 14px; }
  .head { display: flex; align-items: center; gap: 14px; background: var(--surface); border-radius: 18px; padding: 18px; box-shadow: var(--shadow); }
  .info { flex: 1; }
  .info h2 { margin: 0; }
  .grp { font-size: 12px; color: var(--muted); font-weight: 700; }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 20px 0 10px; }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 2: App.svelte'e route ekle**

`src/App.svelte` import satırlarına ekle:
```js
  import TeamDetail from './routes/TeamDetail.svelte';
```
`routes` objesine `'/match/:id': MatchDetail,` satırının ALTINA ekle:
```js
    '/team/:id': TeamDetail,
```

- [ ] **Step 3: Build + doğrulama**

Run: `npm run build` → hatasız. Run: `npm test` → geçer.
İsteğe bağlı: `#/team/MEX` açıldığında takım başlığı, ★ butonu ve maçları görünmeli; ★ tıklanınca dolu/boş değişmeli ve sayfa yenilense bile korunmalı (localStorage).

- [ ] **Step 4: Commit**

```bash
git add src/routes/TeamDetail.svelte src/App.svelte
git commit -m "feat: add team detail page with favorite toggle"
```

---

### Task 9: Favoriler ekranı

**Files:**
- Modify: `src/routes/Favorites.svelte` (placeholder'ı tamamen değiştir)

- [ ] **Step 1: Favorites.svelte'i yaz**

`src/routes/Favorites.svelte` içeriğini TAMAMEN şununla değiştir:
```svelte
<script>
  import { favorites } from '../lib/stores/favorites.js';
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { getTeamMatches } from '../lib/utils/fixtures.js';
  import MatchRow from '../components/MatchRow.svelte';
  import Flag from '../components/Flag.svelte';
</script>

<div class="page">
  <h2>Favoriler</h2>

  {#if $favorites.length === 0}
    <p class="empty">Henüz favori takım yok. Bir takım sayfasından ★ ile ekleyebilirsin.</p>
  {:else}
    {#each $favorites as id (id)}
      {@const team = teamById($teams, id)}
      <a class="team" href={`#/team/${id}`}>
        <Flag code={team?.flag} size={28} />
        <span>{team?.name ?? id}</span>
      </a>
      {#each getTeamMatches($matches, id) as m (m.id)}
        <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
      {/each}
    {/each}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .team { display: flex; align-items: center; gap: 10px; margin: 18px 0 10px; text-decoration: none; color: var(--text); font-weight: 800; font-size: 15px; }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 2: Build + doğrulama**

Run: `npm run build` → hatasız. Run: `npm test` → geçer.
İsteğe bağlı: bir takımı favoriye ekledikten sonra `#/favorites` o takımı ve maçlarını göstermeli; favori yoksa boş mesaj görünmeli.

- [ ] **Step 3: Commit**

```bash
git add src/routes/Favorites.svelte
git commit -m "feat: build favorites screen"
```

---

### Task 10: Puan durumu tablosu bileşeni

**Files:**
- Create: `src/components/StandingsTable.svelte`

- [ ] **Step 1: StandingsTable.svelte'i yaz**

`src/components/StandingsTable.svelte`:
```svelte
<script>
  import { teams, teamById } from '../lib/stores/data.js';
  import Flag from './Flag.svelte';
  export let rows = [];
</script>

<div class="tbl">
  <div class="row head">
    <span class="pos">#</span>
    <span class="team">Takım</span>
    <span>O</span><span>G</span><span>B</span><span>M</span><span>A</span><span class="pts">P</span>
  </div>
  {#each rows as r, i (r.teamId)}
    <a class="row" href={`#/team/${r.teamId}`}>
      <span class="pos">{i + 1}</span>
      <span class="team">
        <Flag code={teamById($teams, r.teamId)?.flag} size={20} />
        {teamById($teams, r.teamId)?.code ?? r.teamId}
      </span>
      <span>{r.P}</span><span>{r.W}</span><span>{r.D}</span><span>{r.L}</span>
      <span>{r.GD > 0 ? '+' : ''}{r.GD}</span><span class="pts">{r.Pts}</span>
    </a>
  {/each}
</div>

<style>
  .tbl { background: var(--surface); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); }
  .row {
    display: grid; grid-template-columns: 24px 1fr 22px 22px 22px 22px 28px 28px;
    align-items: center; gap: 4px; padding: 10px 12px; font-size: 12px;
    text-decoration: none; color: var(--text); border-bottom: 1px solid var(--border);
  }
  .row:last-child { border-bottom: none; }
  .row.head { color: var(--muted); font-weight: 700; text-transform: uppercase; font-size: 10px; }
  .pos { color: var(--muted); }
  .team { display: flex; align-items: center; gap: 8px; font-weight: 700; }
  .row > span:not(.team):not(.pos) { text-align: center; }
  .pts { font-weight: 800; color: var(--accent); }
</style>
```

- [ ] **Step 2: Build doğrulaması**

Run: `npm run build` → hatasız.

- [ ] **Step 3: Commit**

```bash
git add src/components/StandingsTable.svelte
git commit -m "feat: add standings table component"
```

---

### Task 11: Eleme bracket bileşeni

**Files:**
- Create: `src/components/Bracket.svelte`

- [ ] **Step 1: Bracket.svelte'i yaz**

`src/components/Bracket.svelte`:
```svelte
<script>
  import { teams, teamById } from '../lib/stores/data.js';
  export let rounds = [];
</script>

<div class="bracket">
  {#each rounds as round (round.stage)}
    <div class="round">
      <h4>{round.label}</h4>
      {#if round.matches.length}
        {#each round.matches as m (m.id)}
          <a class="bm" href={`#/match/${m.id}`}>
            <span class="t">{teamById($teams, m.homeId)?.code ?? '—'}</span>
            <span class="r">
              {#if m.status === 'finished'}{m.homeScore}-{m.awayScore}{:else}vs{/if}
            </span>
            <span class="t">{teamById($teams, m.awayId)?.code ?? '—'}</span>
          </a>
        {/each}
      {:else}
        <div class="tbd">Henüz belli değil</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .bracket { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
  .round { flex: 0 0 150px; display: flex; flex-direction: column; gap: 8px; }
  .round h4 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
  .bm {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 4px;
    background: var(--surface); border-radius: 10px; padding: 10px 8px; box-shadow: var(--shadow);
    text-decoration: none; color: var(--text); font-size: 12px; font-weight: 700;
  }
  .bm .t { text-align: center; }
  .r { color: var(--muted); font-weight: 800; font-size: 11px; }
  .tbd { background: var(--surface); border: 1px dashed var(--border); border-radius: 10px; padding: 14px 8px; text-align: center; color: var(--muted); font-size: 11px; }
</style>
```

- [ ] **Step 2: Build doğrulaması**

Run: `npm run build` → hatasız.

- [ ] **Step 3: Commit**

```bash
git add src/components/Bracket.svelte
git commit -m "feat: add knockout bracket component"
```

---

### Task 12: Turnuva ekranı (Gruplar / Eleme sekmeleri)

**Files:**
- Modify: `src/routes/Tournament.svelte` (placeholder'ı tamamen değiştir)

- [ ] **Step 1: Tournament.svelte'i yaz**

`src/routes/Tournament.svelte` içeriğini TAMAMEN şununla değiştir:
```svelte
<script>
  import { matches, teams } from '../lib/stores/data.js';
  import { computeStandings } from '../lib/utils/standings.js';
  import { getBracketRounds } from '../lib/utils/tournament.js';
  import StandingsTable from '../components/StandingsTable.svelte';
  import Bracket from '../components/Bracket.svelte';

  let view = 'groups';
  $: standings = computeStandings($matches, $teams);
  $: rounds = getBracketRounds($matches);
</script>

<div class="page">
  <h2>Turnuva</h2>

  <div class="seg">
    <button class:on={view === 'groups'} on:click={() => (view = 'groups')}>Gruplar</button>
    <button class:on={view === 'bracket'} on:click={() => (view = 'bracket')}>Eleme</button>
  </div>

  {#if view === 'groups'}
    {#each standings as g (g.group)}
      <h3 class="grp">Grup {g.group}</h3>
      <StandingsTable rows={g.rows} />
    {/each}
    {#if standings.length === 0}
      <p class="empty">Gruplar henüz hazır değil.</p>
    {/if}
  {:else}
    <Bracket {rounds} />
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .seg { display: flex; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 4px; margin-bottom: 16px; }
  .seg button {
    flex: 1; background: transparent; border: none; cursor: pointer; padding: 8px;
    border-radius: 999px; font-weight: 700; font-size: 13px; color: var(--muted);
  }
  .seg button.on { background: var(--accent); color: #fff; }
  .grp { font-size: 13px; font-weight: 800; margin: 18px 0 10px; }
  .empty { color: var(--muted); }
</style>
```

- [ ] **Step 2: Build + doğrulama**

Run: `npm run build` → hatasız. Run: `npm test` → tüm testler geçer.
İsteğe bağlı: `#/tournament`'ta "Gruplar/Eleme" sekmeleri; Gruplar'da grup tabloları (seed veride sonuç yok → 0 puanlı satırlar), Eleme'de 5 tur kolonu "Henüz belli değil" ile görünmeli.

- [ ] **Step 3: Commit**

```bash
git add src/routes/Tournament.svelte
git commit -m "feat: build tournament screen with standings and bracket"
```

---

## Self-Review Notları

- **Spec kapsamı:** Fikstür + tarih/grup filtresi (Task 6) ✓; takım sayfası + favori (Task 5, 8, 9) ✓; grup puan durumu (Task 1, 10, 12) ✓; eleme bracket (Task 3, 11, 12) ✓; maç detayı saat/stad/golcüler (Task 7) ✓. Veri otomasyonu (football-data.org Action) bu planın DIŞINDA — ayrı Plan 4.
- **Tip/imza tutarlılığı:** `teamById(list, id)` ve yeni `matchById(list, id)` aynı kalıpta; `computeStandings(matches, teams)` → `[{group, rows:[{teamId,P,W,D,L,GF,GA,GD,Pts}]}]`, StandingsTable `rows` prop'unu, Tournament `g.rows`'u geçiriyor — uyumlu. `getBracketRounds(matches)` → `[{stage,label,matches}]`, Bracket `rounds` prop'unu kullanıyor — uyumlu. `getMatchdays` → `[{key,matches}]`, Fixtures `day.key`/`day.matches` kullanıyor — uyumlu.
- **Placeholder yok:** Tüm adımlarda tam kod var.
- **svelte-spa-router v5 notu:** Parametreli route bileşenleri `params` prop'u alır (`export let params = {}`). Geçerli yol gerektiğinde `router.location` (TabBar'da olduğu gibi); bu planda route bileşenleri yalnızca `params` kullanıyor.
