<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { predictions } from '../lib/stores/predictions.js';
  import { computePredictionScore, isMatchPredictable } from '../lib/utils/prediction-scoring.js';
  import PredictionScorecard from '../components/PredictionScorecard.svelte';
  import PredictMatch from '../components/PredictMatch.svelte';

  $: score = computePredictionScore($predictions, $matches);
  $: championTeam = $predictions.champion ? teamById($teams, $predictions.champion) : null;

  $: open = [...$matches]
    .filter((m) => isMatchPredictable(m))
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))
    .slice(0, 8);

  $: scored = [...$matches]
    .filter((m) => m.status === 'finished' && $predictions.matchScores[m.id])
    .sort((a, b) => Date.parse(b.datetimeUTC) - Date.parse(a.datetimeUTC))
    .slice(0, 6);
</script>

<div class="page">
  <h2>Tahminlerin</h2>

  <PredictionScorecard {score} {championTeam} />

  {#if open.length}
    <section>
      <h3 class="sec">Sıradaki tahminler</h3>
      <div class="list">
        {#each open as m (m.id)}
          <PredictMatch match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
        {/each}
      </div>
    </section>
  {/if}

  {#if scored.length}
    <section>
      <h3 class="sec">Sonuçlanan tahminler</h3>
      <div class="list">
        {#each scored as m (m.id)}
          <PredictMatch match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
        {/each}
      </div>
    </section>
  {/if}

  {#if open.length === 0 && scored.length === 0}
    <p class="empty">Tahmin edilecek maç yok.</p>
  {/if}
</div>

<style>
  .page { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 0 0 10px; }
  .list { display: flex; flex-direction: column; gap: 10px; }
  .empty { color: var(--muted); }
</style>
