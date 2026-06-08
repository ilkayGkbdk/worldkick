<script>
  import { matches } from '../lib/stores/data.js';
  import { predictions } from '../lib/stores/predictions.js';
  import { computePredictionScore } from '../lib/utils/prediction-scoring.js';
  $: score = computePredictionScore($predictions, $matches);
</script>

<div class="page">
  <h2>Tahminlerin</h2>
  <p class="total">{score.total} <span>puan</span></p>
  <p class="soon">Tahmin girişi yakında.</p>
</div>

<style>
  .page { padding: 16px; }
  .total { font-family: var(--font-head); font-weight: 800; font-size: 40px; }
  .total span { font-size: 16px; color: var(--muted); }
  .soon { color: var(--muted); }
</style>
