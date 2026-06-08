<script>
  import { favorites } from '../lib/stores/favorites.js';
  export let teamId;
  $: isFav = $favorites.includes(teamId);
</script>

<button
  class="fav"
  class:on={isFav}
  on:click|preventDefault|stopPropagation={() => favorites.toggle(teamId)}
  aria-pressed={isFav}
  aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
  {isFav ? '★' : '☆'}
</button>

<style>
  .fav {
    background: transparent; border: none; cursor: pointer;
    font-size: 20px; line-height: 1; color: var(--muted); padding: 4px;
  }
  .fav.on { color: var(--accent); }
</style>
