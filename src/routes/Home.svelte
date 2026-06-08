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
