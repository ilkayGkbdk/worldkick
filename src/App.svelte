<script>
  import Router from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import { loadAll } from './lib/stores/data.js';
  import TabBar from './components/TabBar.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import Home from './routes/Home.svelte';
  import Fixtures from './routes/Fixtures.svelte';
  import Tournament from './routes/Tournament.svelte';
  import Favorites from './routes/Favorites.svelte';
  import MatchDetail from './routes/MatchDetail.svelte';
  import TeamDetail from './routes/TeamDetail.svelte';
  import Predictions from './routes/Predictions.svelte';

  const routes = {
    '/': Home,
    '/fixtures': Fixtures,
    '/tournament': Tournament,
    '/favorites': Favorites,
    '/match/:id': MatchDetail,
    '/team/:id': TeamDetail,
    '/predictions': Predictions,
  };
  onMount(loadAll);
</script>

<header class="topbar">
  <span class="brand">World<span style="color:var(--accent)">Kick</span></span>
  <ThemeToggle />
</header>

<main>
  <Router {routes} />
</main>

<TabBar />

<style>
  .topbar {
    position: sticky; top: 0; z-index: 10; display: flex;
    align-items: center; justify-content: space-between;
    padding: 12px 16px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .brand { font-family: var(--font-head); font-weight: 800; font-size: 18px; }
  main { max-width: 480px; margin: 0 auto; padding-bottom: 80px; }
</style>
