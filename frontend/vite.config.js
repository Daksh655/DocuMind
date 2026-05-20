import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // required for docker port mapping
    watch: {
      usePolling: true // ensures hot reloading works inside docker container
    }
  }
})
