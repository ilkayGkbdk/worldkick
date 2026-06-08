<script>
  export let code = ''; // ISO alpha-2, lowercase
  export let size = 34;

  // Lazy map: each flag SVG becomes an async loader, so only the flags
  // actually rendered get fetched (instead of inlining all ~430 into the JS).
  const flagLoaders = import.meta.glob(
    '/node_modules/circle-flags/flags/*.svg',
    { query: '?url', import: 'default' }
  );

  let src = '';
  $: resolveFlag(code);

  async function resolveFlag(c) {
    const loader = c ? flagLoaders[`/node_modules/circle-flags/flags/${c}.svg`] : null;
    src = loader ? await loader() : '';
  }
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
