import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/ethers')) return 'ethers';
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        }
      }
    }
  }
});
