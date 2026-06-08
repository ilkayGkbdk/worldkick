<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { getMatchdays, filterByGroup } from '../lib/utils/fixtures.js';
  import { formatLocalDate } from '../lib/utils/datetime.js';
  import MatchRow from '../components/MatchRow.svelte';

  let group = '';
  $: groups = [...new Set($teams.map((t) => t.group).filter((g) => g && g !== '?'))].sort();
  $: days = getMatchdays(filterByGroup($matches, group));
</script>

<div class="page">
  <h2>Fikstür</h2>

  <div class="chips">
    <button class="chip" class:on={group === ''} on:click={() => (group = '')}>Tümü</button>
    {#each groups as g}
      <button class="chip" class:on={group === g} on:click={() => (group = g)}>Grup {g}</button>
    {/each}
  </div>

  {#each days as day (day.key)}
    <h3 class="day">{formatLocalDate(day.matches[0].datetimeUTC)}</h3>
    {#each day.matches as m (m.id)}
      <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
    {/each}
  {/each}

  {#if days.length === 0}
    <p class="empty">Maç bulunamadı.</p>
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; }
  .chip {
    flex: 0 0 auto; background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); border-radius: 999px; padding: 6px 14px; font-size: 12px;
    font-weight: 700; cursor: pointer; white-space: nowrap;
  }
  .chip.on { background: var(--accent); color: #fff; border-color: var(--accent); }
  .day {
    font-size: 12px; text-transform: uppercase; letter-spacing: 2px;
    color: var(--muted); margin: 18px 0 10px;
  }
  .empty { color: var(--muted); }
</style>
