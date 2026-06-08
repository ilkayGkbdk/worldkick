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
