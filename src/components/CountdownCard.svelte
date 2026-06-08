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
