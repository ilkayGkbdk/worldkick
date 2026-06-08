import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/worldkick/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WorldKick',
        short_name: 'WorldKick',
        start_url: '/worldkick/',
        scope: '/worldkick/',
        display: 'standalone',
        background_color: '#0b0b10',
        theme_color: '#ff2e63',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
});
