<script>
  import { matches, teams, teamById, matchById } from '../lib/stores/data.js';
  import { formatLocalDate, formatLocalTime } from '../lib/utils/datetime.js';
  import Flag from '../components/Flag.svelte';
  import { predictions } from '../lib/stores/predictions.js';

  export let params = {};
  $: match = matchById($matches, params.id);
  $: home = match ? teamById($teams, match.homeId) : null;
  $: away = match ? teamById($teams, match.awayId) : null;
  $: finished = match?.status === 'finished';
  $: myPred = match ? $predictions.matchScores[match.id] : null;
</script>

<div class="page">
  <button class="back" on:click={() => window.history.back()} aria-label="Geri">← Geri</button>

  {#if !match}
    <p class="empty">Maç bulunamadı.</p>
  {:else}
    <div class="hero">
      <a class="side" href={`#/team/${match.homeId}`}>
        <Flag code={home?.flag} size={56} />
        <span>{home?.name ?? match.homeId}</span>
      </a>
      <div class="center">
        {#if finished}
          <div class="score">{match.homeScore} - {match.awayScore}</div>
        {:else}
          <div class="time">{formatLocalTime(match.datetimeUTC)}</div>
          <div class="vs">VS</div>
        {/if}
      </div>
      <a class="side" href={`#/team/${match.awayId}`}>
        <Flag code={away?.flag} size={56} />
        <span>{away?.name ?? match.awayId}</span>
      </a>
    </div>

    {#if myPred}
      <div class="mypred">Tahminin: <b>{myPred.home} - {myPred.away}</b></div>
    {/if}

    <div class="meta">
      <div><span class="k">Tarih</span><span>{formatLocalDate(match.datetimeUTC)} · {formatLocalTime(match.datetimeUTC)}</span></div>
      <div><span class="k">Stat</span><span>{match.venue}</span></div>
      {#if match.city}
        <div><span class="k">Şehir</span><span>{match.city}</span></div>
      {/if}
      {#if match.group}
        <div><span class="k">Grup</span><span>{match.group}</span></div>
      {/if}
    </div>

    {#if match.scorers && match.scorers.length}
      <h3 class="sec">Goller</h3>
      <ul class="scorers">
        {#each match.scorers as s, i (i)}
          <li>{s.name}{#if s.minute} <span class="min">{s.minute}'</span>{/if}</li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .page { padding: 16px; }
  .back { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; padding: 0 0 12px; font-size: 14px; }
  .hero { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; background: var(--surface); border-radius: 18px; padding: 22px 14px; box-shadow: var(--shadow); border-top: 3px solid var(--accent); }
  .side { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: var(--text); font-weight: 700; font-size: 13px; text-align: center; }
  .center { text-align: center; }
  .score { font-family: var(--font-head); font-size: 34px; font-weight: 800; }
  .time { font-weight: 800; font-size: 18px; }
  .vs { color: var(--muted); font-size: 12px; font-weight: 800; }
  .meta { margin-top: 16px; display: flex; flex-direction: column; gap: 1px; background: var(--border); border-radius: 14px; overflow: hidden; }
  .meta > div { display: flex; justify-content: space-between; background: var(--surface); padding: 12px 14px; font-size: 13px; }
  .k { color: var(--muted); }
  .sec { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin: 20px 0 10px; }
  .scorers { list-style: none; padding: 0; margin: 0; }
  .scorers li { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .min { color: var(--muted); }
  .empty { color: var(--muted); }
  .mypred { margin-top: 12px; text-align: center; font-size: 12px; color: var(--muted); }
  .mypred b { color: var(--accent); font-family: var(--font-head); }
</style>
