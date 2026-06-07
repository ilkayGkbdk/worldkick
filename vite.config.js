import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/worldkick/',
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
