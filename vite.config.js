import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk splitting for faster page loads
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunk (cached separately by browser)
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        }
      }
    },
    // Warn if any chunk exceeds 600KB
    chunkSizeWarningLimit: 600,
    // Minify with esbuild (default, fastest)
    minify: 'esbuild',
    // Generate source maps for production debugging
    sourcemap: false,
  },
  // Faster dev server
  server: {
    port: 5173,
    open: false,
  }
})
