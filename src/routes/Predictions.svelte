<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { predictions } from '../lib/stores/predictions.js';
  import { computePredictionScore, isLocked } from '../lib/utils/prediction-scoring.js';
  import PredictionScorecard from '../components/PredictionScorecard.svelte';
  import { renderScorecard } from '../lib/share/scorecard-canvas.js';
  import PredictMatch from '../components/PredictMatch.svelte';
  import LockBanner from '../components/LockBanner.svelte';

  $: score = computePredictionScore($predictions, $matches);
  $: championTeam = $predictions.champion ? teamById($teams, $predictions.champion) : null;

  $: realTeams = $teams.filter((t) => t.group && t.group !== '?');

  $: open = isLocked($matches)
    ? []
    : [...$matches]
        .filter((m) => m.stage === 'group')
        .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC));

  $: scored = [...$matches]
    .filter((m) => m.status === 'finished' && $predictions.matchScores[m.id])
    .sort((a, b) => Date.parse(b.datetimeUTC) - Date.parse(a.datetimeUTC))
    .slice(0, 6);

  async function share() {
    const canvas = document.createElement('canvas');
    const acc = score.scoredCount ? Math.round((score.correctCount / score.scoredCount) * 100) : 0;
    renderScorecard(canvas, {
      total: score.total, accuracy: acc, exactCount: score.exactCount,
      championName: championTeam?.name ?? null,
    });
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], 'worldkick-tahmin.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'WorldKick tahmin karnem' }); return; } catch {}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'worldkick-tahmin.png'; a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="page">
  <h2>Tahminlerin</h2>

  <LockBanner matches={$matches} />

  <PredictionScorecard {score} {championTeam} />
  <button class="share" on:click={share}>Kartı paylaş</button>

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
  .lock { color: var(--muted); font-weight: 600; letter-spacing: 0; text-transform: none; }
  .share { align-self: flex-start; background: var(--accent); color: #fff; border: none; border-radius: 999px; padding: 10px 18px; font-weight: 800; font-size: 13px; cursor: pointer; }
</style>
