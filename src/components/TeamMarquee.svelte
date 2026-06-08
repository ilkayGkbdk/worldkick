<script>
  import Flag from './Flag.svelte';
  export let teams = [];
  // Duplicate the list so the -50% scroll loops seamlessly.
  $: loop = [...teams, ...teams];
</script>

<div class="marquee">
  <div class="track">
    {#each loop as t, i (i)}
      <a class="chip" href={`#/team/${t.id}`} aria-label={t.name}>
        <Flag code={t.flag} size={28} />
        <span>{t.code}</span>
      </a>
    {/each}
  </div>
</div>

<style>
  .marquee {
    overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
  }
  .track {
    display: flex; gap: 10px; width: max-content;
    animation: scroll 65s linear infinite;
  }
  .marquee:hover .track { animation-play-state: paused; }
  .chip {
    flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 999px;
    padding: 6px 13px 6px 6px; text-decoration: none; color: var(--text);
    font-weight: 700; font-size: 12px;
  }
  @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
</style>
