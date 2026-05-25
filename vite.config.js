import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const RELAY_API = 'https://gsd-gvcs-popcat.gcinhak.workers.dev'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: RELAY_API,
        changeOrigin: true,
        headers: {
          Origin: 'https://gsd.gvcs.kr',
        },
      },
    },
  },
})
