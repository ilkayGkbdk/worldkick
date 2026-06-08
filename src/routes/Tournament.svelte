<script>
  import { matches, teams } from '../lib/stores/data.js';
  import { computeStandings } from '../lib/utils/standings.js';
  import { getBracketRounds } from '../lib/utils/tournament.js';
  import StandingsTable from '../components/StandingsTable.svelte';
  import Bracket from '../components/Bracket.svelte';

  let view = 'groups';
  $: standings = computeStandings($matches, $teams);
  $: rounds = getBracketRounds($matches);
</script>

<div class="page">
  <h2>Turnuva</h2>

  <div class="seg">
    <button class:on={view === 'groups'} on:click={() => (view = 'groups')}>Gruplar</button>
    <button class:on={view === 'bracket'} on:click={() => (view = 'bracket')}>Eleme</button>
  </div>

  {#if view === 'groups'}
    {#each standings as g (g.group)}
      <h3 class="grp">Grup {g.group}</h3>
      <StandingsTable rows={g.rows} />
    {/each}
    {#if standings.length === 0}
      <p class="empty">Gruplar henüz hazır değil.</p>
    {/if}
  {:else}
    <Bracket {rounds} />
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .seg { display: flex; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 4px; margin-bottom: 16px; }
  .seg button {
    flex: 1; background: transparent; border: none; cursor: pointer; padding: 8px;
    border-radius: 999px; font-weight: 700; font-size: 13px; color: var(--muted);
  }
  .seg button.on { background: var(--accent); color: #fff; }
  .grp { font-size: 13px; font-weight: 800; margin: 18px 0 10px; }
  .empty { color: var(--muted); }
</style>
