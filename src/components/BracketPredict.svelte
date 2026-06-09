<script>
  import { predictions } from '../lib/stores/predictions.js';
  import { getBracketRounds } from '../lib/utils/tournament.js';
  import { isBracketPredictable, scoreBracket } from '../lib/utils/prediction-scoring.js';
  import { teamById } from '../lib/stores/data.js';
  import Flag from './Flag.svelte';

  export let matches = [];
  export let teams = [];

  $: rounds = getBracketRounds(matches).filter((r) => r.matches.length);

  function pick(id, teamId, editable) {
    if (editable) predictions.setBracketPick(id, teamId);
  }
</script>

<div class="rounds">
  {#each rounds as round (round.stage)}
    <div class="round">
      <h4>{round.label}</h4>
      {#each round.matches as m (m.id)}
        {@const editable = isBracketPredictable(m, teams)}
        {@const choice = $predictions.bracketPicks[m.id]}
        {@const pts = m.status === 'finished' && choice ? scoreBracket(choice, m) : null}
        <div class="bm">
          <button class="side" class:on={choice === m.homeId} disabled={!editable}
            on:click={() => pick(m.id, m.homeId, editable)}>
            <Flag code={teamById(teams, m.homeId)?.flag} size={20} /> {teamById(teams, m.homeId)?.code ?? '—'}
          </button>
          <button class="side" class:on={choice === m.awayId} disabled={!editable}
            on:click={() => pick(m.id, m.awayId, editable)}>
            <Flag code={teamById(teams, m.awayId)?.flag} size={20} /> {teamById(teams, m.awayId)?.code ?? '—'}
          </button>
          {#if pts !== null}<span class="pts" class:win={pts > 0}>+{pts}</span>{/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .rounds { display: flex; flex-direction: column; gap: 16px; }
  .round h4 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
  .bm { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; margin-bottom: 8px; }
  .side {
    display: flex; align-items: center; gap: 7px; justify-content: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 9px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 12px;
  }
  .side.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .side:disabled { opacity: .6; cursor: default; }
  .pts { font-weight: 800; font-size: 12px; color: var(--muted); }
  .pts.win { color: var(--accent); }
</style>
