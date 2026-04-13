import { defineConfig } from 'vite'

// `base: './'` keeps asset URLs relative so the built app works on GitHub Pages
// project sites (e.g. /repo-name/) and most static hosts without extra config.
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
})
