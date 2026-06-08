<script>
  import { theme } from '../lib/stores/theme.js';
  const order = ['system', 'light', 'dark'];
  const label = { system: '🌗', light: '☀️', dark: '🌙' };
  function cycle() {
    const next = order[(order.indexOf($theme) + 1) % order.length];
    theme.set(next);
  }
</script>

<button class="toggle" on:click={cycle} aria-label="Tema değiştir">
  {label[$theme]}
</button>

<style>
  .toggle {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 999px; width: 38px; height: 38px; font-size: 16px;
    cursor: pointer; color: var(--text);
  }
</style>
