import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    commonjsOptions: {
      include: [/phaser/],
    },
  },
  optimizeDeps: {
    include: ['phaser'],
  },
});
