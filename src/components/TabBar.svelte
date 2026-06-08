<script>
  import { router } from 'svelte-spa-router';
  const tabs = [
    { path: '/', icon: '🏠', label: 'Ana Sayfa' },
    { path: '/fixtures', icon: '📅', label: 'Fikstür' },
    { path: '/tournament', icon: '🏆', label: 'Turnuva' },
    { path: '/favorites', icon: '⭐', label: 'Favoriler' },
  ];
</script>

<nav class="tabbar">
  {#each tabs as tab}
    <a href={`#${tab.path}`} class="tab" class:active={router.location === tab.path}>
      <span class="icon">{tab.icon}</span>
      <span class="lbl">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed; bottom: 0; left: 0; right: 0; display: flex;
    background: var(--surface); border-top: 1px solid var(--border);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  }
  .tab {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: 2px; text-decoration: none; color: var(--muted); font-size: 10px;
  }
  .tab.active { color: var(--accent); }
  .icon { font-size: 18px; }
</style>
