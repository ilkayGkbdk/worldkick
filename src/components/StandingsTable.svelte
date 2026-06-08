<script>
  import { teams, teamById } from '../lib/stores/data.js';
  import Flag from './Flag.svelte';
  export let rows = [];
</script>

<div class="tbl">
  <div class="row head">
    <span class="pos">#</span>
    <span class="team">Takım</span>
    <span>O</span><span>G</span><span>B</span><span>M</span><span>A</span><span class="pts">P</span>
  </div>
  {#each rows as r, i (r.teamId)}
    <a class="row" href={`#/team/${r.teamId}`}>
      <span class="pos">{i + 1}</span>
      <span class="team">
        <Flag code={teamById($teams, r.teamId)?.flag} size={20} />
        {teamById($teams, r.teamId)?.code ?? r.teamId}
      </span>
      <span>{r.P}</span><span>{r.W}</span><span>{r.D}</span><span>{r.L}</span>
      <span>{r.GD > 0 ? '+' : ''}{r.GD}</span><span class="pts">{r.Pts}</span>
    </a>
  {/each}
</div>

<style>
  .tbl { background: var(--surface); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); }
  .row {
    display: grid; grid-template-columns: 24px 1fr 22px 22px 22px 22px 28px 28px;
    align-items: center; gap: 4px; padding: 10px 12px; font-size: 12px;
    text-decoration: none; color: var(--text); border-bottom: 1px solid var(--border);
  }
  .row:last-child { border-bottom: none; }
  .row.head { color: var(--muted); font-weight: 700; text-transform: uppercase; font-size: 10px; }
  .pos { color: var(--muted); }
  .team { display: flex; align-items: center; gap: 8px; font-weight: 700; }
  .row > span:not(.team):not(.pos) { text-align: center; }
  .pts { font-weight: 800; color: var(--accent); }
</style>
