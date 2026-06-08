<script>
  import { router } from 'svelte-spa-router';
  import Icon from './Icon.svelte';
  const tabs = [
    { path: '/', icon: 'home', label: 'Ana Sayfa' },
    { path: '/fixtures', icon: 'calendar', label: 'Fikstür' },
    { path: '/tournament', icon: 'trophy', label: 'Turnuva' },
    { path: '/favorites', icon: 'star', label: 'Favoriler' },
  ];
</script>

<nav class="tabbar">
  {#each tabs as tab}
    <a href={`#${tab.path}`} class="tab" class:active={router.location === tab.path}>
      <Icon name={tab.icon} size={22} />
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
    gap: 3px; text-decoration: none; color: var(--muted); font-size: 10px;
    font-weight: 600;
  }
  .tab.active { color: var(--accent); }
</style>
