# WorldKick — Veri Otomasyonu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** football-data.org'dan 2026 Dünya Kupası verisini periyodik çeken, uygulamanın JSON şemasına dönüştürüp commit eden ve siteyi otomatik yeniden yayınlayan bir GitHub Actions boru hattı kurmak.

**Architecture:** Build-zamanı Node script'leri `scripts/` altında. `transform.mjs` (saf, TDD'li) API yanıtını `teams.json`/`matches.json`'a çevirir; `team-meta.mjs` TLA→{bayrak, Türkçe ad} sabit tablosu. `update-data.mjs` veriyi çeker, dönüştürür, `public/data/`'ya yazar. `.github/workflows/update-data.yml` cron ile çalışır, değişiklik varsa commit'ler ve deploy'u tetikler. Puan durumu/bracket client'ta hesaplandığı için Action standings üretmez.

**Tech Stack:** Node 20 (global `fetch`), Vitest, GitHub Actions, football-data.org API v4 (competition `WC`, header `X-Auth-Token`, free tier).

**Mevcut kod tabanı:** `public/data/{teams,matches,meta}.json` (Plan 1 seed — Action bunları üretip üzerine yazacak). matches.json şeması: `{ id, stage('group'|'r32'|'r16'|'qf'|'sf'|'final'|'third'), group('A'..'L'|null), homeId, awayId, datetimeUTC, venue, city, status('scheduled'|'live'|'finished'), homeScore, awayScore, scorers[] }`. teams.json: `{ id, name, code, group, flag }`. Deploy workflow `.github/workflows/deploy.yml` zaten `main`'e push'ta + `workflow_dispatch` ile çalışıyor.

---

### Task 1: API → şema dönüştürücü (TDD)

**Files:**
- Create: `scripts/transform.mjs`
- Test: `scripts/transform.test.mjs`

- [ ] **Step 1: Başarısız testi yaz**

`scripts/transform.test.mjs`:
```js
import { describe, it, expect } from 'vitest';
import { mapStage, mapGroup, mapStatus, transformMatches } from './transform.mjs';

describe('mappers', () => {
  it('mapStage API stage kodlarını iç koda çevirir', () => {
    expect(mapStage('GROUP_STAGE')).toBe('group');
    expect(mapStage('LAST_16')).toBe('r16');
    expect(mapStage('FINAL')).toBe('final');
    expect(mapStage('SOMETHING_NEW')).toBe('group');
  });
  it('mapGroup GROUP_A → A, null → null', () => {
    expect(mapGroup('GROUP_A')).toBe('A');
    expect(mapGroup(null)).toBeNull();
  });
  it('mapStatus durumları sınıflandırır', () => {
    expect(mapStatus('FINISHED')).toBe('finished');
    expect(mapStatus('IN_PLAY')).toBe('live');
    expect(mapStatus('TIMED')).toBe('scheduled');
  });
});

describe('transformMatches', () => {
  const api = [
    {
      id: 100, utcDate: '2026-06-11T20:00:00Z', status: 'FINISHED',
      stage: 'GROUP_STAGE', group: 'GROUP_A', venue: 'Estadio Azteca',
      score: { fullTime: { home: 2, away: 1 } },
      homeTeam: { id: 1, name: 'Mexico', tla: 'MEX' },
      awayTeam: { id: 2, name: 'United States', tla: 'USA' },
    },
    {
      id: 200, utcDate: '2026-07-19T19:00:00Z', status: 'TIMED',
      stage: 'FINAL', group: null, venue: 'MetLife Stadium',
      score: { fullTime: { home: null, away: null } },
      homeTeam: { id: 1, name: 'Mexico', tla: 'MEX' },
      awayTeam: { id: 3, name: 'Brazil', tla: 'BRA' },
    },
  ];
  const meta = { MEX: { tr: 'Meksika', flag: 'mx' }, USA: { tr: 'ABD', flag: 'us' } };

  it('maçları iç şemaya çevirir', () => {
    const { matches } = transformMatches(api, meta);
    expect(matches[0]).toMatchObject({
      id: '100', stage: 'group', group: 'A', homeId: 'MEX', awayId: 'USA',
      datetimeUTC: '2026-06-11T20:00:00Z', venue: 'Estadio Azteca', city: '',
      status: 'finished', homeScore: 2, awayScore: 1, scorers: [],
    });
    expect(matches[1]).toMatchObject({ id: '200', stage: 'final', group: null, status: 'scheduled', homeScore: null, awayScore: null });
  });

  it('takımları toplar, meta tablosundan ad/bayrak uygular, grubu atar', () => {
    const { teams } = transformMatches(api, meta);
    const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
    expect(byId.MEX).toMatchObject({ id: 'MEX', name: 'Meksika', code: 'MEX', group: 'A', flag: 'mx' });
    expect(byId.USA).toMatchObject({ name: 'ABD', flag: 'us', group: 'A' });
    // meta tablosunda olmayan takım: API adına ve boş bayrağa düşer
    expect(byId.BRA).toMatchObject({ id: 'BRA', name: 'Brazil', flag: '', group: '?' });
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu doğrula**

Run: `npm test -- transform`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implementasyonu yaz**

`scripts/transform.mjs`:
```js
const STAGE_MAP = {
  GROUP_STAGE: 'group',
  LAST_32: 'r32',
  LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'third',
  FINAL: 'final',
};

export function mapStage(apiStage) {
  return STAGE_MAP[apiStage] ?? 'group';
}

export function mapGroup(apiGroup) {
  if (!apiGroup) return null;
  const m = /^GROUP_([A-L])$/.exec(apiGroup);
  return m ? m[1] : null;
}

export function mapStatus(apiStatus) {
  if (apiStatus === 'FINISHED' || apiStatus === 'AWARDED') return 'finished';
  if (apiStatus === 'IN_PLAY' || apiStatus === 'PAUSED') return 'live';
  return 'scheduled';
}

function registerTeam(map, t, group, teamMeta) {
  const id = t?.tla || String(t?.id ?? '');
  if (!id) return;
  const existing = map.get(id);
  if (existing) {
    if (group && (!existing.group || existing.group === '?')) existing.group = group;
    return;
  }
  const meta = teamMeta[id] ?? {};
  map.set(id, {
    id,
    name: meta.tr ?? t?.name ?? id,
    code: id,
    group: group ?? '?',
    flag: meta.flag ?? '',
  });
}

export function transformMatches(apiMatches, teamMeta = {}) {
  const teamsMap = new Map();
  const matches = apiMatches.map((m) => {
    const group = mapGroup(m.group);
    const home = m.homeTeam ?? {};
    const away = m.awayTeam ?? {};
    registerTeam(teamsMap, home, group, teamMeta);
    registerTeam(teamsMap, away, group, teamMeta);
    return {
      id: String(m.id),
      stage: mapStage(m.stage),
      group,
      homeId: home.tla || String(home.id ?? ''),
      awayId: away.tla || String(away.id ?? ''),
      datetimeUTC: m.utcDate,
      venue: m.venue ?? '',
      city: '',
      status: mapStatus(m.status),
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      scorers: [],
    };
  });
  return { teams: [...teamsMap.values()], matches };
}
```

- [ ] **Step 4: Testin geçtiğini doğrula**

Run: `npm test -- transform`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/transform.mjs scripts/transform.test.mjs
git commit -m "feat: add football-data API transform"
```
COMMIT KURALI: Conventional Commits, ASLA Co-Authored-By, --author yok.

---

### Task 2: Takım meta tablosu (bayrak + Türkçe ad)

**Files:**
- Create: `scripts/team-meta.mjs`

- [ ] **Step 1: team-meta.mjs'i yaz**

`scripts/team-meta.mjs` (TLA → ISO alpha-2 bayrak kodu + Türkçe ad. circle-flags için İngiltere/İskoçya/Galler özel kodları kullanılır. Eşleşmeyen TLA'lar transform'da API adına + boş bayrağa düşer):
```js
export const teamMeta = {
  CAN: { tr: 'Kanada', flag: 'ca' },
  MEX: { tr: 'Meksika', flag: 'mx' },
  USA: { tr: 'ABD', flag: 'us' },
  ARG: { tr: 'Arjantin', flag: 'ar' },
  BRA: { tr: 'Brezilya', flag: 'br' },
  URU: { tr: 'Uruguay', flag: 'uy' },
  COL: { tr: 'Kolombiya', flag: 'co' },
  ECU: { tr: 'Ekvador', flag: 'ec' },
  PAR: { tr: 'Paraguay', flag: 'py' },
  PER: { tr: 'Peru', flag: 'pe' },
  CHI: { tr: 'Şili', flag: 'cl' },
  FRA: { tr: 'Fransa', flag: 'fr' },
  ENG: { tr: 'İngiltere', flag: 'gb-eng' },
  SCO: { tr: 'İskoçya', flag: 'gb-sct' },
  WAL: { tr: 'Galler', flag: 'gb-wls' },
  ESP: { tr: 'İspanya', flag: 'es' },
  GER: { tr: 'Almanya', flag: 'de' },
  POR: { tr: 'Portekiz', flag: 'pt' },
  NED: { tr: 'Hollanda', flag: 'nl' },
  BEL: { tr: 'Belçika', flag: 'be' },
  ITA: { tr: 'İtalya', flag: 'it' },
  CRO: { tr: 'Hırvatistan', flag: 'hr' },
  SUI: { tr: 'İsviçre', flag: 'ch' },
  DEN: { tr: 'Danimarka', flag: 'dk' },
  POL: { tr: 'Polonya', flag: 'pl' },
  SRB: { tr: 'Sırbistan', flag: 'rs' },
  AUT: { tr: 'Avusturya', flag: 'at' },
  TUR: { tr: 'Türkiye', flag: 'tr' },
  UKR: { tr: 'Ukrayna', flag: 'ua' },
  CZE: { tr: 'Çekya', flag: 'cz' },
  NOR: { tr: 'Norveç', flag: 'no' },
  SWE: { tr: 'İsveç', flag: 'se' },
  JPN: { tr: 'Japonya', flag: 'jp' },
  KOR: { tr: 'Güney Kore', flag: 'kr' },
  AUS: { tr: 'Avustralya', flag: 'au' },
  IRN: { tr: 'İran', flag: 'ir' },
  KSA: { tr: 'Suudi Arabistan', flag: 'sa' },
  QAT: { tr: 'Katar', flag: 'qa' },
  UZB: { tr: 'Özbekistan', flag: 'uz' },
  JOR: { tr: 'Ürdün', flag: 'jo' },
  MAR: { tr: 'Fas', flag: 'ma' },
  SEN: { tr: 'Senegal', flag: 'sn' },
  TUN: { tr: 'Tunus', flag: 'tn' },
  ALG: { tr: 'Cezayir', flag: 'dz' },
  EGY: { tr: 'Mısır', flag: 'eg' },
  NGA: { tr: 'Nijerya', flag: 'ng' },
  GHA: { tr: 'Gana', flag: 'gh' },
  CMR: { tr: 'Kamerun', flag: 'cm' },
  CIV: { tr: 'Fildişi Sahili', flag: 'ci' },
  RSA: { tr: 'Güney Afrika', flag: 'za' },
  CRC: { tr: 'Kosta Rika', flag: 'cr' },
  PAN: { tr: 'Panama', flag: 'pa' },
  JAM: { tr: 'Jamaika', flag: 'jm' },
  HON: { tr: 'Honduras', flag: 'hn' },
  NZL: { tr: 'Yeni Zelanda', flag: 'nz' },
};
```

- [ ] **Step 2: Geçerli modül olduğunu doğrula**

Run: `node -e "import('./scripts/team-meta.mjs').then((m) => console.log(Object.keys(m.teamMeta).length + ' takım'))"`
Expected: `56 takım` (veya yazılan giriş sayısı) — hatasız.

- [ ] **Step 3: Commit**

```bash
git add scripts/team-meta.mjs
git commit -m "feat: add team flag/name lookup table"
```

---

### Task 3: Veri çekme + yazma script'i

**Files:**
- Create: `scripts/update-data.mjs`, `scripts/sample-matches.json`
- Modify: `package.json` (script ekle)

- [ ] **Step 1: Örnek API yanıtı oluştur (offline dry-run için)**

`scripts/sample-matches.json`:
```json
{
  "matches": [
    {
      "id": 100, "utcDate": "2026-06-11T20:00:00Z", "status": "SCHEDULED",
      "stage": "GROUP_STAGE", "group": "GROUP_A", "venue": "Estadio Azteca",
      "score": { "fullTime": { "home": null, "away": null } },
      "homeTeam": { "id": 1, "name": "Mexico", "tla": "MEX" },
      "awayTeam": { "id": 2, "name": "United States", "tla": "USA" }
    }
  ]
}
```

- [ ] **Step 2: update-data.mjs'i yaz**

`scripts/update-data.mjs`:
```js
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { transformMatches } from './transform.mjs';
import { teamMeta } from './team-meta.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const COMPETITION = 'WC';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

async function getMatches() {
  const sample = arg('--sample');
  if (sample) {
    const raw = JSON.parse(await readFile(sample, 'utf8'));
    return raw.matches ?? [];
  }
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error('FOOTBALL_DATA_TOKEN tanımlı değil.');
  const res = await fetch(`https://api.football-data.org/v4/competitions/${COMPETITION}/matches`, {
    headers: { 'X-Auth-Token': token },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.matches ?? [];
}

async function main() {
  const outDir = arg('--out') ?? path.join(here, '..', 'public', 'data');
  const apiMatches = await getMatches();
  const { teams, matches } = transformMatches(apiMatches, teamMeta);
  const meta = { lastUpdated: new Date().toISOString(), currentMatchday: matches.length ? 1 : 0 };

  await mkdir(outDir, { recursive: true });
  const write = (name, value) =>
    writeFile(path.join(outDir, name), JSON.stringify(value, null, 2) + '\n');
  await write('teams.json', teams);
  await write('matches.json', matches);
  await write('meta.json', meta);
  console.log(`Wrote ${teams.length} teams, ${matches.length} matches to ${outDir}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 3: package.json'a script ekle**

`package.json` `scripts` bloğuna ekle:
```json
"update-data": "node scripts/update-data.mjs"
```

- [ ] **Step 4: Offline dry-run ile doğrula (repo verisine dokunmadan)**

Run:
```bash
node scripts/update-data.mjs --sample scripts/sample-matches.json --out /tmp/wk-data && cat /tmp/wk-data/teams.json
```
Expected: "Wrote 2 teams, 1 matches to /tmp/wk-data" ve teams.json içinde MEX (Meksika, bayrak mx) + USA (ABD, bayrak us), grup A. `public/data/` DEĞİŞMEMELİ (git diff temiz).

- [ ] **Step 5: Commit**

```bash
git add scripts/update-data.mjs scripts/sample-matches.json package.json
git commit -m "feat: add data fetch/transform script"
```

---

### Task 4: Boş şehir satırını gizle (maç detayı düzeltmesi)

**Files:**
- Modify: `src/routes/MatchDetail.svelte`

> Sebep: API `city` alanı vermiyor (Action `city: ''` yazıyor). Boş "Şehir" satırı görünmemeli.

- [ ] **Step 1: Şehir satırını koşullu yap**

`src/routes/MatchDetail.svelte` içinde şu satırı:
```svelte
      <div><span class="k">Şehir</span><span>{match.city}</span></div>
```
şununla değiştir:
```svelte
      {#if match.city}
        <div><span class="k">Şehir</span><span>{match.city}</span></div>
      {/if}
```

- [ ] **Step 2: Build + test**

Run: `npm run build` → hatasız. Run: `npm test` → tüm testler geçer.

- [ ] **Step 3: Commit**

```bash
git add src/routes/MatchDetail.svelte
git commit -m "fix: hide empty city row on match detail"
```

---

### Task 5: GitHub Actions veri güncelleme workflow'u

**Files:**
- Create: `.github/workflows/update-data.yml`

- [ ] **Step 1: update-data.yml'i yaz**

`.github/workflows/update-data.yml` (cron + manuel tetik; değişiklik varsa commit'ler ve deploy'u tetikler. `run:` adımlarına dış/untrusted girdi enjekte edilmez):
```yaml
name: Update match data

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

permissions:
  contents: write
  actions: write

concurrency:
  group: update-data
  cancel-in-progress: false

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Fetch and transform data
        env:
          FOOTBALL_DATA_TOKEN: ${{ secrets.FOOTBALL_DATA_TOKEN }}
        run: node scripts/update-data.mjs
      - name: Commit if changed
        id: commit
        run: |
          if git diff --quiet -- public/data; then
            echo "changed=false" >> "$GITHUB_OUTPUT"
            echo "No data changes."
          else
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git add public/data
            git commit -m "chore: update match data"
            git push
            echo "changed=true" >> "$GITHUB_OUTPUT"
          fi
      - name: Trigger deploy
        if: steps.commit.outputs.changed == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: gh workflow run deploy.yml --ref main
```

- [ ] **Step 2: YAML'in geçerli olduğunu doğrula**

Run: `node -e "const f=require('fs').readFileSync('.github/workflows/update-data.yml','utf8'); if(!/FOOTBALL_DATA_TOKEN/.test(f)||!/workflow_dispatch/.test(f)) throw new Error('eksik'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/update-data.yml
git commit -m "ci: add scheduled match data update workflow"
```

---

## Manuel Kurulum (kod değil — kullanıcı/operatör adımları)

Bu adımlar workflow'un canlı çalışması için gereklidir; commit edilemez:

1. **Token al:** https://www.football-data.org/client/register adresinden ücretsiz kayıt ol; e-postayla gelen API token'ını kopyala.
2. **Secret ekle:** Repo → Settings → Secrets and variables → Actions → "New repository secret" → Name: `FOOTBALL_DATA_TOKEN`, Value: token. (Veya `gh secret set FOOTBALL_DATA_TOKEN`.)
3. **İlk çalıştırma:** Actions → "Update match data" → "Run workflow" (veya `gh workflow run update-data.yml`). Çalışınca `public/data/*.json` gerçek 2026 verisiyle güncellenir, değişiklik varsa deploy tetiklenir.
4. **Not:** football-data.org free tier golcü/detaylı istatistik vermeyebilir; `scorers` boş kalır (UI bunu zaten zarifçe gizler). Cron her 15 dk çalışır; turnuva dışında istenirse workflow geçici devre dışı bırakılabilir. Repo public olduğu için Actions dakikaları ücretsizdir.

---

## Self-Review Notları

- **Spec kapsamı:** "GitHub Actions cron → football-data.org → JSON üret → commit → otomatik yayın" ✓ (Task 1–5). Standings client'ta hesaplandığı için `standings.json` üretilmiyor — spec'teki standings.json maddesi bilinçli olarak kapsamdan çıkarıldı (DRY: tek kaynak matches.json).
- **Tip/imza tutarlılığı:** `transformMatches(apiMatches, teamMeta)` → `{ teams, matches }`; üretilen matches/teams alanları Plan 1-2-3'teki şemayla (id,stage,group,homeId,awayId,datetimeUTC,venue,city,status,homeScore,awayScore,scorers / id,name,code,group,flag) birebir aynı. `mapStage` çıktıları (`group/r32/r16/qf/sf/final`) `getBracketRounds`'un beklediği stage'lerle uyumlu; `mapGroup` çıktısı (`'A'..'L'`) `computeStandings`/grup filtresiyle uyumlu.
- **Placeholder yok:** Tüm adımlarda tam kod var. Manuel kurulum adımları kod değil, operatör görevidir ve ayrı bölümde.
- **Güvenlik:** Workflow `run:` adımları yalnızca sabit komutlar içerir; hiçbir `github.event.*` untrusted girdi shell'e enjekte edilmez. Token GitHub Secret'tan env ile geçer, log'a yazılmaz.
- **Deploy tetikleme:** GITHUB_TOKEN ile yapılan push başka workflow'u tetiklemediğinden, değişiklik olduğunda deploy `gh workflow run deploy.yml` ile açıkça tetiklenir (`actions: write` izniyle).
