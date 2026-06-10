import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base keeps the static build portable for the Tauri/desktop package.
  base: './',
  // Fixed dev port so `tauri dev` can reliably attach to it.
  server: { port: 1420, strictPort: true },
})
