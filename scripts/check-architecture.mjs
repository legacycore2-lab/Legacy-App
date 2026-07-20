import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const root = resolve('src')
const files = []

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts')) files.push(path)
  }
}

walk(root)
const violations = []

for (const file of files) {
  const path = relative(root, file).replaceAll('\\', '/')
  const source = readFileSync(file, 'utf8')
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])

  if (/\/(components|pages|hooks)\//.test(`/${path}`)) {
    for (const value of imports) {
      const targetPath = value.startsWith('.')
        ? relative(root, resolve(dirname(file), value)).replaceAll('\\', '/')
        : value
      if (targetPath.includes('/repositories/') || targetPath.startsWith('lib/supabase')) {
        violations.push(`${path}: UI/Hook must not import Repository or Supabase (${value})`)
      }
    }
  }

  const feature = path.match(/^features\/([^/]+)\//)?.[1]
  if (feature) {
    for (const value of imports) {
      const targetPath = value.startsWith('.')
        ? relative(root, resolve(dirname(file), value)).replaceAll('\\', '/')
        : value
      const target = targetPath.match(/^features\/([^/]+)/)?.[1]
      if (target && target !== feature) violations.push(`${path}: cross-feature internal import (${value})`)
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`Architecture boundaries passed for ${files.length} source files.`)
