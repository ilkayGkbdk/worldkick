<script>
  export let code = ''; // ISO alpha-2, lowercase
  export let size = 34;

  // Map all flag SVGs to URLs at build time.
  const flagUrls = import.meta.glob(
    '/node_modules/circle-flags/flags/*.svg',
    { eager: true, query: '?url', import: 'default' }
  );
  $: src = code
    ? flagUrls[`/node_modules/circle-flags/flags/${code}.svg`] ?? ''
    : '';
</script>

{#if src}
  <img class="flag" {src} alt={code} style="width:{size}px;height:{size}px" />
{:else}
  <span class="flag fallback" style="width:{size}px;height:{size}px">{(code || '').toUpperCase()}</span>
{/if}

<style>
  .flag { border-radius: 50%; object-fit: cover; display: inline-block; }
  .fallback {
    background: var(--border); color: var(--muted);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }
</style>
