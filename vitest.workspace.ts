import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // If you want to keep running your existing tests in Node.js, uncomment the next line.
  // 'vite.config.ts',
  {
    extends: 'vite.config.ts',
    test: {
      include: ['./src/*'],
      browser: {
        enabled: true,
        provider: 'playwright',
        // at least one instance is required
        instances: [{ browser: 'chromium' }],
      },
    },
  },
])

import 'vitest-browser-react'
