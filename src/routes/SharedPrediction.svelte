<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { decodePredictions } from '../lib/share/predictions-url.js';
  import { computePredictionScore } from '../lib/utils/prediction-scoring.js';
  import PredictionScorecard from '../components/PredictionScorecard.svelte';
  import BracketTree from '../components/BracketTree.svelte';

  export let params = {};
  $: shared = decodePredictions(params.payload);
  $: score = shared ? computePredictionScore(shared, $matches) : null;
  $: championTeam = shared?.champion ? teamById($teams, shared.champion) : null;
</script>

<div class="page">
  <button class="back" on:click={() => window.history.back()} aria-label="Geri">← Geri</button>
  {#if !shared}
    <p class="empty">Bu paylaşım bağlantısı geçersiz.</p>
    <a class="cta" href="#/predictions">Kendi tahminini yap →</a>
  {:else}
    <div class="tag">👋 Bir arkadaşının tahmini</div>
    <PredictionScorecard {score} {championTeam} />
    <section>
      <h3 class="sec">Bracket ağacı</h3>
      <BracketTree bracket={shared.bracket} champion={shared.champion} matches={$matches} teams={$teams} readonly={true} />
    </section>
    <a class="cta" href="#/predictions">Kendi tahminini yap →</a>
  {/if}
</div>

<style>
  .page { padding: 16px; display: flex; flex-direction: column; gap: 18px; }
  .back { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; padding: 0; font-size: 14px; align-self: flex-start; }
  .tag { font-size: 13px; font-weight: 700; color: var(--muted); }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 0 0 10px; }
  .cta { align-self: flex-start; background: var(--accent); color: #fff; text-decoration: none; border-radius: 999px; padding: 10px 18px; font-weight: 800; font-size: 13px; }
  .empty { color: var(--muted); }
</style>
