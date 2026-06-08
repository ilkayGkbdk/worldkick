<script>
  import Flag from './Flag.svelte';
  export let groups = [];
</script>

<div class="rail">
  {#each groups as g (g.group)}
    <a class="gcard" href="#/tournament" aria-label={`Grup ${g.group}`}>
      <span class="gh">Grup {g.group}</span>
      <div class="rows">
        {#each g.teams as t (t.id)}
          <span class="row"><Flag code={t.flag} size={20} /> <span class="code">{t.code}</span></span>
        {/each}
      </div>
    </a>
  {/each}
</div>

<style>
  .rail { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x mandatory; }
  .rail::-webkit-scrollbar { display: none; }
  .gcard {
    scroll-snap-align: start; flex: 0 0 138px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 14px; box-shadow: var(--shadow); text-decoration: none; color: var(--text);
  }
  .gh { display: inline-block; font-family: var(--font-head); font-weight: 800; font-size: 13px; color: var(--accent); margin-bottom: 11px; }
  .rows { display: flex; flex-direction: column; gap: 9px; }
  .row { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; }
  .code { color: var(--text); }
</style>
