import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * ARCHITECT // VOID_WEAVER
 * VITE_COMPILER_HARDENING: v2.5.1
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3010,
  }
})