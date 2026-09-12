import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Use terser for better minification (removes console.logs, etc.)
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console statements in production
        drop_console: true,
        drop_debugger: true,
        // Remove dead code
        dead_code: true,
        // Collapse vars
        collapse_vars: true,
      },
      mangle: {
        // Mangle variable names for smaller output
        safari10: true,
      },
      format: {
        // Remove comments
        comments: false,
      },
    },
    // Chunk splitting for better browser caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
    // Warn if any chunk exceeds 600KB
    chunkSizeWarningLimit: 600,
    // Optimize assets
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    open: false,
  },
})
