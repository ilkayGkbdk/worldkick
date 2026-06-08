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
