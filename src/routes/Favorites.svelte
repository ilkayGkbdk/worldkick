<script>
  import { favorites } from '../lib/stores/favorites.js';
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { getTeamMatches } from '../lib/utils/fixtures.js';
  import MatchRow from '../components/MatchRow.svelte';
  import Flag from '../components/Flag.svelte';
</script>

<div class="page">
  <h2>Favoriler</h2>

  {#if $favorites.length === 0}
    <p class="empty">Henüz favori takım yok. Bir takım sayfasından ★ ile ekleyebilirsin.</p>
  {:else}
    {#each $favorites as id (id)}
      {@const team = teamById($teams, id)}
      <a class="team" href={`#/team/${id}`}>
        <Flag code={team?.flag} size={28} />
        <span>{team?.name ?? id}</span>
      </a>
      {#each getTeamMatches($matches, id) as m (m.id)}
        <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
      {/each}
    {/each}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .team { display: flex; align-items: center; gap: 10px; margin: 18px 0 10px; text-decoration: none; color: var(--text); font-weight: 800; font-size: 15px; }
  .empty { color: var(--muted); }
</style>
