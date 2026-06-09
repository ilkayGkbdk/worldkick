<script>
  import { predictions } from '../lib/stores/predictions.js';
  import Flag from './Flag.svelte';
  export let teams = [];
  export let locked = false;
  $: champ = $predictions.champion;
</script>

<div class="grid">
  {#each teams as t (t.id)}
    <button class="cell" class:on={champ === t.id} disabled={locked}
      on:click={() => predictions.setChampion(t.id)} aria-label={t.name}>
      <Flag code={t.flag} size={30} />
      <span>{t.code}</span>
    </button>
  {/each}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; }
  .cell {
    display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 4px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    cursor: pointer; color: var(--text); font-weight: 700; font-size: 11px;
  }
  .cell.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .cell:disabled { opacity: .55; cursor: default; }
</style>
