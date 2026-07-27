import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Legacy-App/',
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/features/projects/services/excel-parser.service.test.ts',
    ],
  },
})
