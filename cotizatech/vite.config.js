import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // El front llama a /api/... y Vite lo reenvía al back (así las cookies funcionan sin CORS)
    proxy: { '/api': 'http://localhost:3000' },
  },
})
