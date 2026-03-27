import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // base removed for custom domain
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts', 'd3'],
          maps: ['leaflet', 'react-leaflet'],
          search: ['fuse.js'],
        },
      },
    },
  },
})
