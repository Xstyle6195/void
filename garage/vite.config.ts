import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js est chargé à part, uniquement pour la vue moteur 3D.
    chunkSizeWarningLimit: 700,
  },
})
