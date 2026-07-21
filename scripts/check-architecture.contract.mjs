import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const guardPath = resolve('scripts/check-architecture.mjs')

function runFixture(files) {
  const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'legacy-core-architecture-'))

  try {
    for (const [path, source] of Object.entries(files)) {
      const target = resolve(fixtureRoot, 'src', path)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, source, 'utf8')
    }

    return spawnSync(process.execPath, [guardPath], {
      cwd: fixtureRoot,
      encoding: 'utf8',
    })
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}

test('accepts the golden data-access chain', () => {
  const result = runFixture({
    'features/orders/pages/OrdersPage.tsx': "import '../hooks/useOrders'",
    'features/orders/hooks/useOrders.ts': "import '../services/orders.service'",
    'features/orders/services/orders.service.ts': "import '../repositories/orders.repository'",
    'features/orders/repositories/orders.repository.ts': "import '../../../lib/supabase/client'",
    'lib/supabase/client.ts': "import '@supabase/supabase-js'",
  })

  assert.equal(result.status, 0, result.stderr)
})

const forbiddenCases = [
  {
    name: 'Page to Service',
    files: { 'features/orders/pages/OrdersPage.tsx': "import '../services/orders.service'" },
    message: 'UI must use Hooks',
  },
  {
    name: 'Hook to Repository',
    files: {
      'features/orders/hooks/useOrders.ts': "export { findOrders } from '../repositories/orders.repository'",
    },
    message: 'Hook must use Service',
  },
  {
    name: 'Service to Supabase SDK',
    files: { 'features/orders/services/orders.service.ts': "const sdk = import('@supabase/supabase-js')" },
    message: 'Service must stay independent',
  },
  {
    name: 'Repository to Service',
    files: {
      'features/orders/repositories/orders.repository.ts':
        "const service = require('../services/orders.service')",
    },
    message: 'Repository must not depend on upper layers',
  },
  {
    name: 'direct Supabase client usage in UI',
    files: { 'features/orders/pages/OrdersPage.tsx': "const query = supabase.from('orders')" },
    message: 'direct Supabase client usage',
  },
  {
    name: 'cross-feature internal import',
    files: {
      'features/orders/services/orders.service.ts': "import '../../billing/services/billing.service'",
    },
    message: 'cross-feature internal import',
  },
]

for (const scenario of forbiddenCases) {
  test(`rejects ${scenario.name}`, () => {
    const result = runFixture(scenario.files)

    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp(scenario.message))
  })
}

test('ignores test and spec files', () => {
  const result = runFixture({
    'features/orders/pages/OrdersPage.test.tsx': "import '../repositories/orders.repository'",
    'features/orders/hooks/useOrders.spec.ts': "import '../repositories/orders.repository'",
  })

  assert.equal(result.status, 0, result.stderr)
})
