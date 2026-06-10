<script>
  import { matches, teams, teamById } from '../lib/stores/data.js';
  import { predictions } from '../lib/stores/predictions.js';
  import { computePredictionScore } from '../lib/utils/prediction-scoring.js';
  import { getMatchdays } from '../lib/utils/fixtures.js';
  import { formatLocalDate } from '../lib/utils/datetime.js';
  import { renderScorecard } from '../lib/share/scorecard-canvas.js';
  import { encodePredictions } from '../lib/share/predictions-url.js';
  import PredictionScorecard from '../components/PredictionScorecard.svelte';
  import PredictMatch from '../components/PredictMatch.svelte';
  import LockBanner from '../components/LockBanner.svelte';
  import BracketTree from '../components/BracketTree.svelte';

  let view = 'bracket'; // 'bracket' | 'scores'

  $: score = computePredictionScore($predictions, $matches);
  $: championTeam = $predictions.champion ? teamById($teams, $predictions.champion) : null;
  $: realTeams = $teams.filter((t) => t.group && t.group !== '?');
  $: groupDays = getMatchdays($matches.filter((m) => m.stage === 'group'));

  async function shareUrl() {
    const url = `${location.origin}${location.pathname}#/p/${encodePredictions($predictions)}`;
    if (navigator.share) { try { await navigator.share({ title: 'WorldKick tahminim', url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); alert('Bağlantı kopyalandı'); } catch {}
  }

  async function shareCard() {
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
  <header class="head">
    <h2>Tahminlerin</h2>
    <div class="shareicons">
      <button class="ic" on:click={shareUrl} title="Tahminimi paylaş" aria-label="Tahminimi paylaş">🔗</button>
      <button class="ic" on:click={shareCard} title="Kartı paylaş" aria-label="Kartı paylaş">📤</button>
    </div>
  </header>

  <LockBanner matches={$matches} />
  <PredictionScorecard {score} {championTeam} />

  <div class="seg">
    <button class:on={view === 'bracket'} on:click={() => (view = 'bracket')}>🏆 Bracket</button>
    <button class:on={view === 'scores'} on:click={() => (view = 'scores')}>⚽ Maç Skorları</button>
  </div>

  {#if view === 'bracket'}
    {#if realTeams.length}
      <BracketTree bracket={$predictions.bracket} champion={$predictions.champion} matches={$matches} teams={$teams} />
    {:else}
      <p class="empty">Takımlar henüz hazır değil.</p>
    {/if}
  {:else}
    {#if groupDays.length}
      {#each groupDays as day (day.key)}
        <div class="day">
          <h3 class="dlab">{formatLocalDate(day.matches[0].datetimeUTC)}</h3>
          <div class="list">
            {#each day.matches as m (m.id)}
              <PredictMatch match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      <p class="empty">Maç bulunamadı.</p>
    {/if}
  {/if}
</div>

<style>
  .page { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
  .head { display: flex; align-items: center; justify-content: space-between; }
  .head h2 { margin: 0; }
  .shareicons { display: flex; gap: 8px; }
  .ic { width: 38px; height: 38px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); font-size: 16px; cursor: pointer; }

  .seg { display: flex; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 4px; }
  .seg button { flex: 1; background: transparent; border: none; cursor: pointer; padding: 9px; border-radius: 999px; font-weight: 800; font-size: 13px; color: var(--muted); }
  .seg button.on { background: var(--accent); color: #fff; }

  .day { margin-top: 4px; }
  .dlab { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 0 0 10px; }
  .list { display: flex; flex-direction: column; gap: 10px; }
  .empty { color: var(--muted); }
</style>
