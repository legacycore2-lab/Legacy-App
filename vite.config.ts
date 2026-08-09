import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Legacy-App/',
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf('node_modules/@tanstack') >= 0) return 'query'
          if (id.indexOf('node_modules/react') >= 0) return 'react'
          if (id.indexOf('node_modules/lucide-react') >= 0) return 'icons'
          if (id.indexOf('/src/features/reports/') >= 0) return 'reports'
          if (id.indexOf('/src/features/projects/') >= 0) return 'projects'
          if (id.indexOf('/src/features/journal/') >= 0) return 'journal'
          if (id.indexOf('/src/features/cash-banks/') >= 0) return 'cash-banks'
          return undefined
        },
      },
    },
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      'src/features/projects/services/excel-parser.service.test.ts',
    ],
  },
})
