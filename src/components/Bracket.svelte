<script>
  import { teams, teamById } from '../lib/stores/data.js';
  export let rounds = [];
</script>

<div class="bracket">
  {#each rounds as round (round.stage)}
    <div class="round">
      <h4>{round.label}</h4>
      {#if round.matches.length}
        {#each round.matches as m (m.id)}
          <a class="bm" href={`#/match/${m.id}`}>
            <span class="t">{teamById($teams, m.homeId)?.code ?? '—'}</span>
            <span class="r">
              {#if m.status === 'finished'}{m.homeScore}-{m.awayScore}{:else}vs{/if}
            </span>
            <span class="t">{teamById($teams, m.awayId)?.code ?? '—'}</span>
          </a>
        {/each}
      {:else}
        <div class="tbd">Henüz belli değil</div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .bracket { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
  .round { flex: 0 0 150px; display: flex; flex-direction: column; gap: 8px; }
  .round h4 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
  .bm {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 4px;
    background: var(--surface); border-radius: 10px; padding: 10px 8px; box-shadow: var(--shadow);
    text-decoration: none; color: var(--text); font-size: 12px; font-weight: 700;
  }
  .bm .t { text-align: center; }
  .r { color: var(--muted); font-weight: 800; font-size: 11px; }
  .tbd { background: var(--surface); border: 1px dashed var(--border); border-radius: 10px; padding: 14px 8px; text-align: center; color: var(--muted); font-size: 11px; }
</style>
