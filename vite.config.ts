import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true,
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    // Performance optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    // Enable minification
    minify: 'esbuild',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
})
