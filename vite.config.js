import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // when running `vercel dev` this isn't needed, but this helps
      // if you ever run vite dev server separately from the API
    }
  }
})
