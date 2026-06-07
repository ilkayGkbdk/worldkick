# WorldKick — Temel & Ana Sayfa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yayınlanabilir bir iskelet kur: Vite+Svelte uygulaması, tema sistemi, hash yönlendirme, alt tab bar, JSON veri yükleme, geri sayımlı Ana Sayfa, elle hazırlanmış seed veri, GitHub Pages deploy ve PWA temeli.

**Architecture:** Statik Vite+Svelte SPA. `/public/data/*.json` tek veri kaynağı, açılışta fetch edilir. Saf mantık (geri sayım, tarih, sıradaki maç) `src/lib/utils` altında izole ve Vitest ile test edilir. Tema CSS değişkenleri + bir store ile yönetilir.

**Tech Stack:** Vite, Svelte, svelte-spa-router, Vitest, vite-plugin-pwa, circle-flags (SVG bayraklar), Lucide ikonlar.

---

### Task 1: Vite + Svelte projesini scaffold et

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.svelte`, `src/app.css`

- [ ] **Step 1: Vite Svelte şablonunu kur**

Run:
```bash
npm create vite@latest . -- --template svelte
npm install
npm install -D vitest jsdom
npm install svelte-spa-router
```
Eğer dizin boş değilse (docs/, .git/ var) Vite "Current directory is not empty" sorabilir → "Ignore files and continue" seç.

- [ ] **Step 2: vite.config.js'i ayarla (base path + vitest)**

`vite.config.js` içeriğini şununla değiştir:
```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/worldkick/',
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 3: package.json'a test script'i ekle**

`scripts` bloğuna `"test": "vitest run"` ve `"test:watch": "vitest"` ekle. (Mevcut `dev`, `build`, `preview` kalsın.)

- [ ] **Step 4: Build'in çalıştığını doğrula**

Run: `npm run build`
Expected: hatasız tamamlanır, `dist/` oluşur.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + Svelte project"
```

---

### Task 2: Geri sayım mantığı (TDD)

**Files:**
- Create: `src/lib/utils/countdown.js`
- Test: `src/lib/utils/countdown.test.js`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/utils/countdown.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { getCountdown } from './countdown.js';

describe('getCountdown', () => {
  it('hedefe kalan gün/saat/dakika/saniyeyi hesaplar', () => {
    const now = Date.UTC(2026, 5, 8, 0, 0, 0);
    const target = Date.UTC(2026, 5, 10, 14, 37, 5);
    expect(getCountdown(target, now)).toEqual({
      days: 2, hours: 14, minutes: 37, seconds: 5, done: false,
    });
  });

  it('hedef geçmişte ise sıfırlanır ve done=true olur', () => {
    const now = Date.UTC(2026, 5, 11, 0, 0, 0);
    const target = Date.UTC(2026, 5, 10, 0, 0, 0);
    expect(getCountdown(target, now)).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0, done: true,
    });
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- countdown`
Expected: FAIL — "getCountdown is not defined" / modül bulunamadı.

- [ ] **Step 3: Minimal implementasyonu yaz**

`src/lib/utils/countdown.js`:
```js
export function getCountdown(targetMs, nowMs = Date.now()) {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diff === 0,
  };
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- countdown`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/countdown.js src/lib/utils/countdown.test.js
git commit -m "feat: add countdown calculation"
```

---

### Task 3: Tarih/saat yardımcıları (TDD)

**Files:**
- Create: `src/lib/utils/datetime.js`
- Test: `src/lib/utils/datetime.test.js`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/utils/datetime.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { formatLocalTime, formatLocalDate, isSameLocalDay } from './datetime.js';

describe('datetime', () => {
  it('formatLocalTime ISO UTC stringini HH:MM döndürür', () => {
    const out = formatLocalTime('2026-06-11T20:00:00Z', 'tr-TR', 'UTC');
    expect(out).toBe('20:00');
  });

  it('formatLocalDate gün ve kısa ay döndürür', () => {
    const out = formatLocalDate('2026-06-11T20:00:00Z', 'tr-TR', 'UTC');
    expect(out).toMatch(/11/);
  });

  it('isSameLocalDay aynı takvim günü için true döner', () => {
    const ref = new Date('2026-06-11T08:00:00Z');
    expect(isSameLocalDay('2026-06-11T23:00:00Z', ref, 'UTC')).toBe(true);
    expect(isSameLocalDay('2026-06-12T01:00:00Z', ref, 'UTC')).toBe(false);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- datetime`
Expected: FAIL — modül bulunamadı.

- [ ] **Step 3: Minimal implementasyonu yaz**

`src/lib/utils/datetime.js`:
```js
export function formatLocalTime(isoUtc, locale = 'tr-TR', timeZone = undefined) {
  return new Date(isoUtc).toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone,
  });
}

export function formatLocalDate(isoUtc, locale = 'tr-TR', timeZone = undefined) {
  return new Date(isoUtc).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', timeZone,
  });
}

export function isSameLocalDay(isoUtc, ref = new Date(), timeZone = undefined) {
  const fmt = (d) => d.toLocaleDateString('en-CA', { timeZone }); // YYYY-MM-DD
  return fmt(new Date(isoUtc)) === fmt(ref);
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- datetime`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/datetime.js src/lib/utils/datetime.test.js
git commit -m "feat: add datetime formatting helpers"
```

---

### Task 4: Sıradaki/bugünkü maç seçimi (TDD)

**Files:**
- Create: `src/lib/utils/fixtures.js`
- Test: `src/lib/utils/fixtures.test.js`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/utils/fixtures.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { getNextMatch, getMatchesOn } from './fixtures.js';

const matches = [
  { id: 1, datetimeUTC: '2026-06-11T20:00:00Z' },
  { id: 2, datetimeUTC: '2026-06-11T23:00:00Z' },
  { id: 3, datetimeUTC: '2026-06-12T18:00:00Z' },
];

describe('fixtures', () => {
  it('getNextMatch şu andan sonraki en erken maçı döner', () => {
    const now = Date.parse('2026-06-11T21:00:00Z');
    expect(getNextMatch(matches, now).id).toBe(2);
  });

  it('gelecekte maç yoksa null döner', () => {
    const now = Date.parse('2026-07-01T00:00:00Z');
    expect(getNextMatch(matches, now)).toBeNull();
  });

  it('getMatchesOn verilen güne ait maçları döner', () => {
    const ref = new Date('2026-06-11T10:00:00Z');
    const ids = getMatchesOn(matches, ref, 'UTC').map((m) => m.id);
    expect(ids).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- fixtures`
Expected: FAIL — modül bulunamadı.

- [ ] **Step 3: Minimal implementasyonu yaz**

`src/lib/utils/fixtures.js`:
```js
import { isSameLocalDay } from './datetime.js';

export function getNextMatch(matches, nowMs = Date.now()) {
  const upcoming = matches
    .filter((m) => Date.parse(m.datetimeUTC) > nowMs)
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));
  return upcoming[0] ?? null;
}

export function getMatchesOn(matches, ref = new Date(), timeZone = undefined) {
  return matches
    .filter((m) => isSameLocalDay(m.datetimeUTC, ref, timeZone))
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- fixtures`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/fixtures.js src/lib/utils/fixtures.test.js
git commit -m "feat: add next/today match selectors"
```

---

### Task 5: Seed veri dosyaları (elle hazırlanmış)

**Files:**
- Create: `public/data/teams.json`, `public/data/matches.json`, `public/data/meta.json`

- [ ] **Step 1: teams.json yaz (örnek alt küme — sonra tamamlanacak)**

`public/data/teams.json`:
```json
[
  { "id": "MEX", "name": "Meksika", "code": "MEX", "group": "A", "flag": "mx" },
  { "id": "USA", "name": "ABD", "code": "USA", "group": "D", "flag": "us" },
  { "id": "CAN", "name": "Kanada", "code": "CAN", "group": "B", "flag": "ca" },
  { "id": "BRA", "name": "Brezilya", "code": "BRA", "group": "F", "flag": "br" },
  { "id": "ARG", "name": "Arjantin", "code": "ARG", "group": "?", "flag": "ar" }
]
```
> `flag` alanı circle-flags dosya adıdır (ISO 3166-1 alpha-2, küçük harf). Tam 48 takım ve gruplar resmi kura sonrası doldurulacak; şimdilik bu alt küme iskeleti çalıştırmak için yeterli.

- [ ] **Step 2: matches.json yaz (örnek maçlar)**

`public/data/matches.json`:
```json
[
  {
    "id": "m1", "stage": "group", "group": "A",
    "homeId": "MEX", "awayId": "USA",
    "datetimeUTC": "2026-06-11T20:00:00Z",
    "venue": "Estadio Azteca", "city": "Mexico City",
    "status": "scheduled", "homeScore": null, "awayScore": null, "scorers": []
  },
  {
    "id": "m2", "stage": "group", "group": "F",
    "homeId": "BRA", "awayId": "ARG",
    "datetimeUTC": "2026-06-11T23:00:00Z",
    "venue": "MetLife Stadium", "city": "New Jersey",
    "status": "scheduled", "homeScore": null, "awayScore": null, "scorers": []
  }
]
```

- [ ] **Step 3: meta.json yaz**

`public/data/meta.json`:
```json
{ "lastUpdated": "2026-06-08T00:00:00Z", "currentMatchday": 1 }
```

- [ ] **Step 4: JSON'ların geçerli olduğunu doğrula**

Run: `node -e "['teams','matches','meta'].forEach(f=>JSON.parse(require('fs').readFileSync('public/data/'+f+'.json')))" && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add public/data
git commit -m "feat: add seed fixture data"
```

---

### Task 6: Veri yükleme katmanı

**Files:**
- Create: `src/lib/data/load.js`, `src/lib/stores/data.js`

- [ ] **Step 1: loadJSON yardımcısını yaz**

`src/lib/data/load.js`:
```js
export async function loadJSON(name) {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
  if (!res.ok) throw new Error(`Veri yüklenemedi: ${name} (${res.status})`);
  return res.json();
}
```

- [ ] **Step 2: data store'unu yaz**

`src/lib/stores/data.js`:
```js
import { writable } from 'svelte/store';
import { loadJSON } from '../data/load.js';

export const teams = writable([]);
export const matches = writable([]);
export const meta = writable(null);
export const loadError = writable(null);

export async function loadAll() {
  try {
    const [t, m, me] = await Promise.all([
      loadJSON('teams'), loadJSON('matches'), loadJSON('meta'),
    ]);
    teams.set(t); matches.set(m); meta.set(me);
  } catch (err) {
    loadError.set(err.message);
  }
}

export function teamById(list, id) {
  return list.find((t) => t.id === id) ?? null;
}
```

- [ ] **Step 3: Build'in geçtiğini doğrula**

Run: `npm run build`
Expected: hatasız tamamlanır.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data src/lib/stores/data.js
git commit -m "feat: add JSON data loading store"
```

---

### Task 7: Tema sistemi (CSS değişkenleri + store)

**Files:**
- Create: `src/lib/stores/theme.js`, `src/components/ThemeToggle.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: app.css'e tema tokenlarını yaz**

`src/app.css` içeriğini şununla değiştir:
```css
:root {
  --accent: #ff2e63;
  --font-head: 'Space Grotesk', system-ui, sans-serif;
  --font-body: system-ui, -apple-system, sans-serif;
}
:root[data-theme='light'] {
  --bg: #f4f4f6; --surface: #ffffff; --text: #16161a;
  --muted: #6b6b76; --border: #ececf0; --shadow: 0 2px 10px rgba(0,0,0,.06);
}
:root[data-theme='dark'] {
  --bg: #0b0b10; --surface: #15151c; --text: #f2f2f5;
  --muted: #9a9aa6; --border: #22222c; --shadow: 0 2px 12px rgba(0,0,0,.4);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg); color: var(--text);
  font-family: var(--font-body); -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-head); letter-spacing: -.5px; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: theme store'unu yaz**

`src/lib/stores/theme.js`:
```js
import { writable } from 'svelte/store';

const KEY = 'wk-theme';
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function resolve(value) {
  return value === 'system' ? (mql.matches ? 'dark' : 'light') : value;
}

function createTheme() {
  const initial = localStorage.getItem(KEY) || 'system';
  const { subscribe, set } = writable(initial);

  function apply(value) {
    document.documentElement.dataset.theme = resolve(value);
  }
  apply(initial);
  mql.addEventListener('change', () => {
    if ((localStorage.getItem(KEY) || 'system') === 'system') apply('system');
  });

  return {
    subscribe,
    set(value) {
      localStorage.setItem(KEY, value);
      apply(value);
      set(value);
    },
  };
}

export const theme = createTheme();
```

- [ ] **Step 3: ThemeToggle bileşenini yaz**

`src/components/ThemeToggle.svelte`:
```svelte
<script>
  import { theme } from '../lib/stores/theme.js';
  const order = ['system', 'light', 'dark'];
  const label = { system: '🌗', light: '☀️', dark: '🌙' };
  function cycle() {
    const next = order[(order.indexOf($theme) + 1) % order.length];
    theme.set(next);
  }
</script>

<button class="toggle" on:click={cycle} aria-label="Tema değiştir">
  {label[$theme]}
</button>

<style>
  .toggle {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 999px; width: 38px; height: 38px; font-size: 16px;
    cursor: pointer; color: var(--text);
  }
</style>
```

- [ ] **Step 4: Build'in geçtiğini doğrula**

Run: `npm run build`
Expected: hatasız tamamlanır.

- [ ] **Step 5: Commit**

```bash
git add src/app.css src/lib/stores/theme.js src/components/ThemeToggle.svelte
git commit -m "feat: add light/dark/system theme system"
```

---

### Task 8: Bayrak ve maç satırı bileşenleri

**Files:**
- Create: `src/components/Flag.svelte`, `src/components/MatchRow.svelte`

- [ ] **Step 1: circle-flags'i kur**

Run: `npm install circle-flags`

- [ ] **Step 2: Flag bileşenini yaz**

`src/components/Flag.svelte`:
```svelte
<script>
  export let code = ''; // ISO alpha-2, küçük harf
  export let size = 34;
  // circle-flags SVG'lerini Vite asset olarak çöz
  import { onMount } from 'svelte';
  let src = '';
  onMount(async () => {
    try {
      const mod = await import(`circle-flags/flags/${code}.svg`);
      src = mod.default;
    } catch { src = ''; }
  });
</script>

{#if src}
  <img class="flag" {src} alt={code} style="width:{size}px;height:{size}px" />
{:else}
  <span class="flag fallback" style="width:{size}px;height:{size}px">{code.toUpperCase()}</span>
{/if}

<style>
  .flag { border-radius: 50%; object-fit: cover; display: inline-block; }
  .fallback {
    background: var(--border); color: var(--muted);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }
</style>
```
> Not: Dinamik `import()` ile glob kullanımı için Vite uyarı verirse Task 8b'deki alternatife geç: tüm bayrakları `import.meta.glob('circle-flags/flags/*.svg')` ile önceden topla. İlk sürümde dinamik import yeterli.

- [ ] **Step 3: MatchRow bileşenini yaz**

`src/components/MatchRow.svelte`:
```svelte
<script>
  import Flag from './Flag.svelte';
  import { formatLocalTime } from '../lib/utils/datetime.js';
  export let match;
  export let home; // team obj
  export let away; // team obj
  $: finished = match.status === 'finished';
</script>

<a class="row" href={`#/match/${match.id}`}>
  <span class="team">
    <Flag code={home?.flag} size={24} /> {home?.code ?? match.homeId}
  </span>
  <span class="mid">
    {#if finished}
      <strong>{match.homeScore} - {match.awayScore}</strong>
    {:else}
      {formatLocalTime(match.datetimeUTC)}
    {/if}
  </span>
  <span class="team away">
    {away?.code ?? match.awayId} <Flag code={away?.flag} size={24} />
  </span>
</a>

<style>
  .row {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
    gap: 8px; padding: 12px 14px; background: var(--surface);
    border-radius: 14px; box-shadow: var(--shadow); text-decoration: none;
    color: var(--text); font-weight: 700; font-size: 13px; margin-bottom: 8px;
  }
  .team { display: flex; align-items: center; gap: 8px; }
  .away { justify-content: flex-end; }
  .mid { font-weight: 800; color: var(--muted); }
</style>
```

- [ ] **Step 4: Build'in geçtiğini doğrula**

Run: `npm run build`
Expected: hatasız tamamlanır.

- [ ] **Step 5: Commit**

```bash
git add src/components/Flag.svelte src/components/MatchRow.svelte
git commit -m "feat: add Flag and MatchRow components"
```

---

### Task 9: Geri sayım kartı bileşeni

**Files:**
- Create: `src/components/CountdownCard.svelte`

- [ ] **Step 1: CountdownCard'ı yaz**

`src/components/CountdownCard.svelte`:
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { getCountdown } from '../lib/utils/countdown.js';
  import { formatLocalTime, formatLocalDate } from '../lib/utils/datetime.js';
  import Flag from './Flag.svelte';

  export let match;
  export let home;
  export let away;

  let cd = getCountdown(Date.parse(match.datetimeUTC));
  let timer;
  onMount(() => {
    timer = setInterval(() => {
      cd = getCountdown(Date.parse(match.datetimeUTC));
    }, 1000);
  });
  onDestroy(() => clearInterval(timer));
  const pad = (n) => String(n).padStart(2, '0');
</script>

<a class="card" href={`#/match/${match.id}`}>
  <span class="label">Sıradaki maç</span>
  <div class="count">
    <div><span class="n">{pad(cd.days)}</span><span class="u">gün</span></div>
    <div><span class="n">{pad(cd.hours)}</span><span class="u">saat</span></div>
    <div><span class="n">{pad(cd.minutes)}</span><span class="u">dk</span></div>
    <div><span class="n">{pad(cd.seconds)}</span><span class="u">sn</span></div>
  </div>
  <div class="teams">
    <span class="t"><Flag code={home?.flag} size={40} /> {home?.code ?? match.homeId}</span>
    <span class="vs">VS</span>
    <span class="t">{away?.code ?? match.awayId} <Flag code={away?.flag} size={40} /></span>
  </div>
  <div class="meta">{formatLocalDate(match.datetimeUTC)} · {formatLocalTime(match.datetimeUTC)} · {match.venue}</div>
</a>

<style>
  .card {
    display: block; background: var(--surface); border-radius: 18px;
    padding: 18px; box-shadow: var(--shadow); border-top: 3px solid var(--accent);
    text-decoration: none; color: var(--text);
  }
  .label {
    font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
    font-weight: 700; color: var(--accent);
  }
  .count { display: flex; gap: 8px; margin: 14px 0; }
  .count > div { flex: 1; text-align: center; }
  .n { display: block; font-family: var(--font-head); font-size: 28px; font-weight: 800; }
  .u { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
  .teams { display: flex; align-items: center; justify-content: space-between; }
  .t { display: flex; align-items: center; gap: 8px; font-weight: 800; }
  .vs { color: var(--muted); font-weight: 800; }
  .meta { margin-top: 12px; text-align: center; font-size: 11px; color: var(--muted); }
</style>
```

- [ ] **Step 2: Build'in geçtiğini doğrula**

Run: `npm run build`
Expected: hatasız tamamlanır.

- [ ] **Step 3: Commit**

```bash
git add src/components/CountdownCard.svelte
git commit -m "feat: add countdown card component"
```

---

### Task 10: Tab bar ve yönlendirme iskeleti

**Files:**
- Create: `src/components/TabBar.svelte`, `src/routes/Home.svelte`, `src/routes/Fixtures.svelte`, `src/routes/Tournament.svelte`, `src/routes/Favorites.svelte`
- Modify: `src/App.svelte`

- [ ] **Step 1: Placeholder route'ları yaz**

`src/routes/Fixtures.svelte`, `src/routes/Tournament.svelte`, `src/routes/Favorites.svelte` (her biri aynı kalıp, başlığı değiştir):
```svelte
<h2 style="padding:16px">Fikstür</h2>
<p style="padding:0 16px;color:var(--muted)">Yakında — sonraki planda.</p>
```
> Tournament için başlık "Turnuva", Favorites için "Favoriler" yaz.

- [ ] **Step 2: TabBar'ı yaz**

`src/components/TabBar.svelte`:
```svelte
<script>
  import { location } from 'svelte-spa-router';
  const tabs = [
    { path: '/', icon: '🏠', label: 'Ana Sayfa' },
    { path: '/fixtures', icon: '📅', label: 'Fikstür' },
    { path: '/tournament', icon: '🏆', label: 'Turnuva' },
    { path: '/favorites', icon: '⭐', label: 'Favoriler' },
  ];
</script>

<nav class="tabbar">
  {#each tabs as tab}
    <a href={`#${tab.path}`} class="tab" class:active={$location === tab.path}>
      <span class="icon">{tab.icon}</span>
      <span class="lbl">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed; bottom: 0; left: 0; right: 0; display: flex;
    background: var(--surface); border-top: 1px solid var(--border);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  }
  .tab {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: 2px; text-decoration: none; color: var(--muted); font-size: 10px;
  }
  .tab.active { color: var(--accent); }
  .icon { font-size: 18px; }
</style>
```

- [ ] **Step 3: App.svelte'i router ile kur**

`src/App.svelte`:
```svelte
<script>
  import Router from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import { loadAll } from './lib/stores/data.js';
  import TabBar from './components/TabBar.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import Home from './routes/Home.svelte';
  import Fixtures from './routes/Fixtures.svelte';
  import Tournament from './routes/Tournament.svelte';
  import Favorites from './routes/Favorites.svelte';

  const routes = {
    '/': Home,
    '/fixtures': Fixtures,
    '/tournament': Tournament,
    '/favorites': Favorites,
  };
  onMount(loadAll);
</script>

<header class="topbar">
  <span class="brand">World<span style="color:var(--accent)">Kick</span></span>
  <ThemeToggle />
</header>

<main>
  <Router {routes} />
</main>

<TabBar />

<style>
  .topbar {
    position: sticky; top: 0; z-index: 10; display: flex;
    align-items: center; justify-content: space-between;
    padding: 12px 16px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .brand { font-family: var(--font-head); font-weight: 800; font-size: 18px; }
  main { max-width: 480px; margin: 0 auto; padding-bottom: 80px; }
</style>
```

- [ ] **Step 4: Home route'unu yaz**

`src/routes/Home.svelte`:
```svelte
<script>
  import { matches, teams, loadError, teamById } from '../lib/stores/data.js';
  import { getNextMatch, getMatchesOn } from '../lib/utils/fixtures.js';
  import CountdownCard from '../components/CountdownCard.svelte';
  import MatchRow from '../components/MatchRow.svelte';

  $: next = getNextMatch($matches);
  $: today = getMatchesOn($matches, new Date());
</script>

<div class="page">
  {#if $loadError}
    <p class="err">Veri yüklenemedi: {$loadError}</p>
  {:else if next}
    <CountdownCard
      match={next}
      home={teamById($teams, next.homeId)}
      away={teamById($teams, next.awayId)} />
  {/if}

  {#if today.length}
    <h3 class="sec">Bugün</h3>
    {#each today as m (m.id)}
      <MatchRow match={m}
        home={teamById($teams, m.homeId)}
        away={teamById($teams, m.awayId)} />
    {/each}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 20px 0 10px; }
  .err { color: var(--accent); }
</style>
```

- [ ] **Step 5: Dev sunucuda elle doğrula**

Run: `npm run dev` ve tarayıcıda `http://localhost:5173/worldkick/` aç.
Expected: Üst barda WorldKick + tema butonu; geri sayım kartı saniyede bir güncelleniyor; alt tab bar görünüyor; tema butonu light/dark/system arasında geçiyor.

- [ ] **Step 6: Commit**

```bash
git add src/App.svelte src/components/TabBar.svelte src/routes
git commit -m "feat: add routing, tab bar and home screen"
```

---

### Task 11: PWA + manifest

**Files:**
- Modify: `vite.config.js`, `index.html`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (geçici placeholder)

- [ ] **Step 1: vite-plugin-pwa'yı kur**

Run: `npm install -D vite-plugin-pwa`

- [ ] **Step 2: vite.config.js'e PWA pluginini ekle**

`vite.config.js` `plugins` dizisini güncelle:
```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/worldkick/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WorldKick',
        short_name: 'WorldKick',
        start_url: '/worldkick/',
        scope: '/worldkick/',
        display: 'standalone',
        background_color: '#0b0b10',
        theme_color: '#ff2e63',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
});
```

- [ ] **Step 3: Placeholder ikonları oluştur**

Run:
```bash
mkdir -p public/icons
node -e "const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'); require('fs').writeFileSync('public/icons/icon-192.png', b); require('fs').writeFileSync('public/icons/icon-512.png', b);"
```
> 1x1 placeholder PNG. Gerçek ikonlar sonra eklenecek.

- [ ] **Step 4: Build'in PWA çıktısı ürettiğini doğrula**

Run: `npm run build`
Expected: `dist/` içinde `manifest.webmanifest` ve `sw.js` üretilir.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js public/icons
git commit -m "feat: add PWA manifest and service worker"
```

---

### Task 12: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: deploy.yml'i yaz**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit ve push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
git push -u origin main
```

- [ ] **Step 3: Pages ayarını ve dağıtımı doğrula**

GitHub repo → Settings → Pages → Source: "GitHub Actions" seç. Actions sekmesinde "Deploy to GitHub Pages" workflow'unun yeşil geçtiğini doğrula. Yayınlanan URL: `https://ilkaygkbdk.github.io/worldkick/`
Expected: Site açılır; geri sayım çalışır; tema değişir.

---

## Self-Review Notları

- **Spec kapsamı (bu plan):** tema ✓, yönlendirme ✓, veri yükleme ✓, geri sayım/Ana Sayfa ✓, seed veri ✓, deploy ✓, PWA ✓. Fikstür filtreleri, detay sayfaları, standings, bracket ve veri otomasyonu **kapsam dışı** — sonraki planlarda.
- **Tip tutarlılığı:** `teamById(list, id)`, `getNextMatch(matches, nowMs)`, `getMatchesOn(matches, ref, tz)`, `getCountdown(targetMs, nowMs)` imzaları tüm tasklarda tutarlı.
- **Placeholder:** seed veri ve ikonlar bilinçli geçici; tam 48 takım ve gerçek ikonlar sonraki planlarda. Bunlar plan içi "TODO" değil, açıkça sınırlanmış kapsam kararlarıdır.

---

## Sonraki Planların Yol Haritası (bu planın parçası değil)

- **Plan 2 — Fikstür & Detaylar:** `getMatchdays`/grup filtresi (TDD), Fixtures ekranı (tarih şeridi + grup filtresi), MatchDetail, TeamDetail, favorites store (`localStorage`).
- **Plan 3 — Turnuva:** `computeStandings(matches, teams)` (TDD), StandingsTable, Bracket bileşeni, Tournament ekranı sekmeleri.
- **Plan 4 — Veri Otomasyonu:** `update-data.yml` (cron + workflow_dispatch), football-data.org çeken Node script'i, `matches.json`/`standings.json` üretimi, GitHub Secret `FOOTBALL_DATA_TOKEN`.
