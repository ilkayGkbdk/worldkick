<script>
  import { onMount, onDestroy } from 'svelte';
  import { getCountdown } from '../lib/utils/countdown.js';
  import { formatLocalDate, formatLocalTime } from '../lib/utils/datetime.js';
  import Flag from './Flag.svelte';

  export let match;
  export let home;
  export let away;
  export let label = 'Sıradaki maç';

  let cd = getCountdown(Date.parse(match.datetimeUTC));
  let timer;
  onMount(() => {
    timer = setInterval(() => {
      cd = getCountdown(Date.parse(match.datetimeUTC));
    }, 1000);
  });
  onDestroy(() => clearInterval(timer));

  const pad = (n) => String(n).padStart(2, '0');
  $: units = [
    ['gün', cd.days],
    ['saat', cd.hours],
    ['dk', cd.minutes],
    ['sn', cd.seconds],
  ];
</script>

<a class="hero" href={`#/match/${match.id}`}>
  <div class="glow" aria-hidden="true"></div>
  <span class="label">{label}</span>

  <div class="teams">
    <div class="team">
      <div class="flagwrap"><Flag code={home?.flag} size={62} /></div>
      <span class="code">{home?.code ?? match.homeId}</span>
      <span class="name">{home?.name ?? ''}</span>
    </div>
    <span class="vs">VS</span>
    <div class="team">
      <div class="flagwrap"><Flag code={away?.flag} size={62} /></div>
      <span class="code">{away?.code ?? match.awayId}</span>
      <span class="name">{away?.name ?? ''}</span>
    </div>
  </div>

  <div class="count">
    {#each units as [unit, val], i}
      <div class="unit">
        {#key val}<span class="n">{pad(val)}</span>{/key}
        <span class="u">{unit}</span>
      </div>
      {#if i < 3}<span class="sep">:</span>{/if}
    {/each}
  </div>

  <div class="meta">{formatLocalDate(match.datetimeUTC)} · {formatLocalTime(match.datetimeUTC)} · {match.venue}</div>
</a>

<style>
  .hero {
    position: relative; display: block; overflow: hidden; text-align: center;
    border-radius: 24px; padding: 24px 20px 20px;
    background:
      radial-gradient(120% 80% at 50% -15%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 62%),
      var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    text-decoration: none; color: var(--text);
  }
  .glow {
    position: absolute; inset: -45% -10% auto -10%; height: 72%; pointer-events: none;
    background: radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--accent) 32%, transparent), transparent 70%);
    filter: blur(34px); opacity: .5; animation: float 8s ease-in-out infinite;
  }
  @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(7px) scale(1.07); } }
  .label {
    position: relative; display: inline-block; font-size: 10px; letter-spacing: 3px;
    text-transform: uppercase; font-weight: 800; color: var(--accent);
    padding: 5px 13px; border-radius: 999px; margin-bottom: 16px;
    border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .teams { position: relative; display: flex; align-items: flex-start; justify-content: center; gap: 16px; }
  .team { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 0; }
  .flagwrap { padding: 5px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 9%, transparent); }
  .code { font-family: var(--font-head); font-weight: 800; font-size: 16px; }
  .name { font-size: 11px; color: var(--muted); max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vs { margin-top: 22px; font-family: var(--font-head); font-weight: 800; color: var(--muted); font-size: 13px; }
  .count { position: relative; display: flex; align-items: flex-start; justify-content: center; gap: 3px; margin: 22px 0 14px; }
  .unit { display: flex; flex-direction: column; align-items: center; min-width: 46px; }
  .n {
    font-family: var(--font-head); font-size: 34px; font-weight: 800; line-height: 1;
    font-variant-numeric: tabular-nums; display: inline-block; animation: pop .42s ease;
  }
  @keyframes pop { from { transform: translateY(-5px); opacity: .25; } to { transform: none; opacity: 1; } }
  .u { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-top: 5px; }
  .sep { font-family: var(--font-head); font-size: 24px; font-weight: 800; line-height: 1.15; color: color-mix(in srgb, var(--muted) 45%, transparent); }
  .meta { position: relative; font-size: 11px; color: var(--muted); }
</style>
