<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  export let score;
  export let championTeam = null;
  const t = tweened(0, { duration: 800, easing: cubicOut });
  $: t.set(score.total);
  $: acc = score.scoredCount ? Math.round((score.correctCount / score.scoredCount) * 100) : 0;
</script>

<div class="card">
  <span class="lab">Tahmin karnen</span>
  <div class="pts">{Math.round($t)} <span>puan</span></div>
  <div class="meta">{score.correctCount}/{score.scoredCount} isabet · %{acc} · {score.exactCount} tam skor</div>
  {#if championTeam}
    <div class="champ">Şampiyon tahminin: <b>{championTeam.name}</b></div>
  {/if}
</div>

<style>
  .card {
    border-radius: 18px; padding: 18px; box-shadow: var(--shadow);
    border: 1px solid var(--border);
    background: radial-gradient(120% 100% at 100% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%), var(--surface);
  }
  .lab { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; color: var(--accent); }
  .pts { font-family: var(--font-head); font-weight: 800; font-size: 36px; line-height: 1; margin: 6px 0 4px; font-variant-numeric: tabular-nums; }
  .pts span { font-size: 15px; color: var(--muted); }
  .meta { font-size: 12px; color: var(--muted); }
  .champ { margin-top: 12px; border-top: 1px solid var(--border); padding-top: 10px; font-size: 12px; color: var(--muted); }
  .champ b { color: var(--text); }
</style>
