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
