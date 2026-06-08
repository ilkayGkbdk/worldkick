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
