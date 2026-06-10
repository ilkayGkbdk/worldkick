<script>
  import { onMount, onDestroy } from 'svelte';
  import { getCountdown } from '../lib/utils/countdown.js';
  export let matches = [];

  $: opening = [...matches].sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))[0] ?? null;

  let now = Date.now();
  let timer;
  onMount(() => { timer = setInterval(() => { now = Date.now(); }, 1000); });
  onDestroy(() => clearInterval(timer));

  $: locked = opening ? now >= Date.parse(opening.datetimeUTC) : false;
  $: cd = opening ? getCountdown(Date.parse(opening.datetimeUTC), now) : null;
  const pad = (n) => String(n).padStart(2, '0');
</script>

{#if opening}
  <div class="bar" class:locked>
    {#if locked}
      <span>🔒 Tahminler kilitlendi — turnuva başladı</span>
    {:else}
      <span>⏳ Kilitlenmeye</span>
      <span class="pill">{cd.days}g {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}</span>
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
  .pill { margin-left: auto; background: var(--accent); color: #fff; border-radius: 999px; padding: 3px 11px; font-size: 12px; font-variant-numeric: tabular-nums; }
</style>
