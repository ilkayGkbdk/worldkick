<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { getTeamMatches } from '../lib/utils/fixtures.js';
  import MatchRow from '../components/MatchRow.svelte';
  import FavoriteButton from '../components/FavoriteButton.svelte';
  import Flag from '../components/Flag.svelte';

  export let params = {};
  $: team = teamById($teams, params.id);
  $: teamMatches = getTeamMatches($matches, params.id);
</script>

<div class="page">
  <button class="back" on:click={() => window.history.back()} aria-label="Geri">← Geri</button>

  {#if !team}
    <p class="empty">Takım bulunamadı.</p>
  {:else}
    <div class="head">
      <Flag code={team.flag} size={56} />
      <div class="info">
        <h2>{team.name}</h2>
        {#if team.group && team.group !== '?'}<span class="grp">Grup {team.group}</span>{/if}
      </div>
      <FavoriteButton teamId={team.id} />
    </div>

    <h3 class="sec">Maçlar</h3>
    {#each teamMatches as m (m.id)}
      <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
    {/each}
    {#if teamMatches.length === 0}
      <p class="empty">Maç bulunamadı.</p>
    {/if}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .back { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; padding: 0 0 12px; font-size: 14px; }
  .head { display: flex; align-items: center; gap: 14px; background: var(--surface); border-radius: 18px; padding: 18px; box-shadow: var(--shadow); }
  .info { flex: 1; }
  .info h2 { margin: 0; }
  .grp { font-size: 12px; color: var(--muted); font-weight: 700; }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 20px 0 10px; }
  .empty { color: var(--muted); }
</style>
