import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Legacy-App/',
  build: {
    rollupOptions: {
      // xlsx is loaded at runtime from cdn.sheetjs.com via dynamic import.
      // Mark as external so the build succeeds when the package is not
      // installed locally (e.g., in sandboxed CI environments).
      external: (id) => id === 'xlsx',
    },
  },
})
